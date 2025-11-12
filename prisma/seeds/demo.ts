// prisma/seeds/demo.ts
import slugify from "slugify";
import {
  DataType,
  ForecastType,
  Prisma,
  PrismaClient,
  Role,
} from "../../src/generated/prisma";

const prisma = new PrismaClient();

// -------- helpers --------
const makeSlug = (base: string) =>
  slugify(base, { lower: true, strict: true, trim: true });

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

// Ensure unique slug within org
async function nextAvailableSlug(orgId: string, base: string): Promise<string> {
  let candidate = base;
  let i = 2;
  while (
    await prisma.forecast.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: candidate } },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

async function main() {
  console.log("🌱 Seeding yFL demo data...");

  // 1️⃣ Organization
  const org = await prisma.organization.upsert({
    where: { name: "yFL Demo Org" },
    update: {},
    create: {
      name: "yFL Demo Org",
      description: "Demo organization for previewing the yFL dashboard.",
    },
  });

  // 2️⃣ User
  const userEmail = "edmiyatake@gmail.com";
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: { organizationId: org.id, role: Role.USER },
    create: {
      email: userEmail,
      name: "Edwin Miyatake",
      role: Role.USER,
      organizationId: org.id,
    },
  });

  console.log("🏢 Org:", org.name, "| 👤 User:", user.email);

  // 3️⃣ Categories (no slug field in schema)
  const categoryData = [
    {
      name: "Macroeconomics",
      description: "Macro indicators like CPI, unemployment, GDP, etc.",
      color: "#2563eb",
    },
    {
      name: "Labor Market",
      description: "Employment, wages, participation rate.",
      color: "#16a34a",
    },
  ] as const;

  const categories = await Promise.all(
    categoryData.map((c) =>
      prisma.forecastCategory.upsert({
        where: {
          organizationId_name: { organizationId: org.id, name: c.name },
        },
        update: {
          description: c.description,
          color: c.color,
        },
        create: {
          organizationId: org.id,
          name: c.name,
          description: c.description,
          color: c.color,
        },
      })
    )
  );

  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  // 4️⃣ Type-safe Forecast definition
  interface ForecastSeed {
    title: string;
    slug: string;
    description: string;
    type: ForecastType;
    dataType?: DataType | null;
    dueInDays: number;
    releaseInDays?: number;
    categoryName?: string;
    options?: string[];
  }

  // 5️⃣ upsertForecast helper
  async function upsertForecast(args: ForecastSeed & { categoryId?: string | null }) {
    const now = new Date();
    const dueDate = addDays(now, args.dueInDays);
    const dataReleaseDate = args.releaseInDays
      ? addDays(now, args.releaseInDays)
      : null;

    const base = makeSlug(args.title);
    const slug = await nextAvailableSlug(org.id, base);

    const createData: Prisma.ForecastCreateInput = {
      organization: { connect: { id: org.id } },
      slug,
      title: args.title,
      description: args.description,
      type: args.type,
      dataType: args.dataType ?? null,
      dueDate,
      dataReleaseDate,
      category: args.categoryId ? { connect: { id: args.categoryId } } : undefined,
      ...(args.options ? { options: args.options as Prisma.InputJsonValue } : {}),
    };

    const updateData: Prisma.ForecastUpdateInput = {
      title: args.title,
      description: args.description,
      type: args.type,
      dataType: args.dataType ?? null,
      dueDate,
      dataReleaseDate,
      category: args.categoryId
        ? { connect: { id: args.categoryId } }
        : { disconnect: true },
      ...(args.options ? { options: args.options as Prisma.InputJsonValue } : {}),
    };

    return prisma.forecast.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug } },
      update: updateData,
      create: createData,
    });
  }

  // 6️⃣ Forecast data array (now fully typed, no `any`)
  const forecastData: ForecastSeed[] = [
    {
      title: "Will US CPI YoY (next release) be ≥ 3.5%?",
      slug: makeSlug("Will US CPI YoY (next release) be ≥ 3.5%?"),
      description: "Forecast whether the next YoY CPI will come in at or above 3.5%.",
      type: ForecastType.BINARY,
      dueInDays: 5,
      releaseInDays: 12,
      categoryName: "Macroeconomics",
    },
    {
      title: "US Unemployment Rate (next release, %) — Point Estimate",
      slug: makeSlug("US Unemployment Rate (next release, %) — Point Estimate"),
      description: "Provide a single-point estimate for the unemployment rate.",
      type: ForecastType.CONTINUOUS,
      dataType: DataType.PERCENT,
      dueInDays: 7,
      releaseInDays: 14,
      categoryName: "Labor Market",
    },
  ];

  const createdForecasts = [];
  for (const f of forecastData) {
    const categoryId = f.categoryName
      ? categoryByName.get(f.categoryName)?.id ?? null
      : null;

    createdForecasts.push(
      await upsertForecast({
        ...f,
        categoryId,
      })
    );
  }

  console.log(
    "📈 Forecasts upserted:",
    createdForecasts.map((x) => `${x.title} (${x.slug})`)
  );

  // 7️⃣ Predictions
  const binary = createdForecasts[0];
  const continuous = createdForecasts[1];

  await prisma.prediction.upsert({
    where: { forecastId_userId: { forecastId: binary.id, userId: user.id } },
    update: {},
    create: {
      forecastId: binary.id,
      userId: user.id,
      value: "5000",
      confidence: 65,
      reasoning:
        "Energy base effects plus shelter persistence. Nowcasting models suggest an upside risk.",
      method: "Nowcast blend + recent CPI component trends",
      estimatedTime: 15,
    },
  });

  await prisma.prediction.upsert({
    where: { forecastId_userId: { forecastId: continuous.id, userId: user.id } },
    update: {},
    create: {
      forecastId: continuous.id,
      userId: user.id,
      value: "4.8",
      confidence: 55,
      reasoning:
        "Claims data imply slight uptick; consistent with prior months’ trend.",
      method: "Top-down labor market model",
      estimatedTime: 10,
    },
  });

  console.log("✅ Demo forecasts + predictions seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Demo seed failed:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
