// prisma/seed.ts
import "dotenv/config";
import slugify from "slugify";
import config from "../src/constants/config";
import {
  DataType,
  ForecastType,
  LedgerKind,
  Prisma,
  PrismaClient,
  Role
} from "../src/generated/prisma";

const prisma = new PrismaClient();

const CENTS = (d: number) => Math.round(d * 100);
const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

function makeSlug(base: string) {
  return slugify(base, { lower: true, strict: true, trim: true }).slice(0, 160);
}

/**
 * Returns a unique slug for the org by suffixing -2, -3, ... if needed.
 * Deterministic if you call in a stable order.
 */
async function nextAvailableSlug(orgId: string, base: string) {
  const taken = await prisma.forecast.findMany({
    where: { organizationId: orgId, slug: { startsWith: base } },
    select: { slug: true },
  });
  const set = new Set(taken.map((t) => t.slug.toLowerCase()));
  if (!set.has(base)) return base;
  let n = 2;
  while (set.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

async function seedAdmin() {
  const adminEmail = config.nextAuth.adminEmail;
  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL is not set in environment variables");
    process.exit(1);
  }

  console.log("🌱 Seeding admin user...");
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    if (existing.role !== Role.SUPER_ADMIN) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: Role.SUPER_ADMIN },
      });
      console.log(`🔄 Updated role to SUPER_ADMIN for ${adminEmail}`);
    } else {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
    }
    return;
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date(),
      name: "Super Admin",
    },
  });
  console.log(`✅ Created admin user: ${adminEmail}`);
}

async function seedRegularUser() {
  const userEmail = "edmiyatake@gmail.com";
  console.log("🌱 Seeding regular user...");

  // Create or find user
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      role: Role.USER,
      name: "Edwin Miyatake",
      emailVerified: new Date(),
    },
  });

  // Ledger (idempotent via memo)
  const ledgerAlready = await prisma.ledgerEntry.findFirst({
    where: { userId: user.id, memo: "SEED: Starting grant $10k" },
  });
  if (!ledgerAlready) {
    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: user.id,
          amountCents: CENTS(10000),
          kind: LedgerKind.PAYMENT,
          memo: "SEED: Starting grant $10k",
        },
        {
          userId: user.id,
          amountCents: CENTS(10000),
          kind: LedgerKind.PAYMENT,
          memo: "SEED: Loan proceeds $10k",
        },
        {
          userId: user.id,
          amountCents: CENTS(10000),
          kind: LedgerKind.DEBT,
          memo: "SEED: Loan principal $10k (outstanding)",
        },
      ],
    });
    console.log(`💰 Seeded ledger for ${userEmail}`);
  } else {
    console.log(`⚠️  Ledger already seeded for ${userEmail}`);
  }

  // Organization
  const org = await prisma.organization.upsert({
    where: { name: "Seeded Test Organization" }, // assumes name unique
    update: {},
    create: {
      name: "Seeded Test Organization",
      description: "A seeded test organization for dashboard testing",
    },
  });

  // Link user to org
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: org.id },
  });

  // Categories (requires @@unique([organizationId, name]) on ForecastCategory)
  const [salesCat, marketingCat] = await Promise.all([
    prisma.forecastCategory.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: "Sales",
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name: "Sales",
        color: "#22c55e",
      },
    }),
    prisma.forecastCategory.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: "Marketing",
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name: "Marketing",
        color: "#3b82f6",
      },
    }),
  ]);

  // Helper to upsert a forecast by (organizationId, slug)
  async function upsertForecast(args: {
    title: string;
    description?: string;
    type: ForecastType;
    dataType?: DataType | null;
    dueInDays: number;
    releaseInDays?: number;
    categoryId?: string | null;
    options?: string[]; // <-- no `| null`
  }) {
    const now = new Date();
    const dueDate = addDays(now, args.dueInDays);
    const dataReleaseDate = args.releaseInDays ? addDays(now, args.releaseInDays) : null;

    const base = makeSlug(args.title);
    const slug = await nextAvailableSlug(org.id, base);

    // Build data objects without setting `options` unless present
    const createData: Prisma.ForecastCreateInput = {
      organization: { connect: { id: org.id } },
      slug,
      title: args.title,
      description: args.description ?? null,
      type: args.type,
      dataType: args.dataType ?? null,
      dueDate,
      dataReleaseDate,
      category: args.categoryId ? { connect: { id: args.categoryId } } : undefined,
      ...(args.options ? { options: args.options as Prisma.InputJsonValue } : {}), // <-- include only if provided
    };

    const updateData: Prisma.ForecastUpdateInput = {
      title: args.title,
      description: args.description ?? null,
      type: args.type,
      dataType: args.dataType ?? null,
      dueDate,
      dataReleaseDate,
      category: args.categoryId ? { connect: { id: args.categoryId } } : { disconnect: true },
      ...(args.options ? { options: args.options as Prisma.InputJsonValue } : {}), // <-- same here
    };

    return prisma.forecast.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug } },
      update: updateData,
      create: createData,
    });
  }

  // Seed 3 forecasts
  const f1 = await upsertForecast({
    title: "Will we close the MegaCorp deal by month-end?",
    description: "Binary forecast about a key enterprise contract.",
    type: ForecastType.BINARY,
    dueInDays: 14,
    releaseInDays: 16,
    categoryId: salesCat.id,
  });

  const f2 = await upsertForecast({
    title: "Q1 Revenue (USD)",
    description: "Continuous forecast of quarterly revenue.",
    type: ForecastType.CONTINUOUS,
    dataType: DataType.CURRENCY,
    dueInDays: 30,
    releaseInDays: 45,
    categoryId: salesCat.id,
  });

  const f3 = await upsertForecast({
    title: "Which channel wins Q1 CAC?",
    description: "Categorical: pick the lowest CAC channel.",
    type: ForecastType.CATEGORICAL,
    options: ["Search Ads", "Social Ads", "Email", "Events"],
    dueInDays: 21,
    releaseInDays: 35,
    categoryId: marketingCat.id,
  });

  // Add example predictions for the user (idempotent via findFirst)
  const alreadyPred = await prisma.prediction.findFirst({
    where: { userId: user.id, forecastId: f1.id },
  });

  if (!alreadyPred) {
    await prisma.prediction.createMany({
      data: [
        {
          forecastId: f1.id,
          userId: user.id,
          value: "true", // for BINARY store "true"/"false"
          confidence: 65,
          reasoning: "Late-stage negotiations; legal review nearly complete.",
          method: "Expert judgment",
          estimatedTime: 10,
        },
        {
          forecastId: f2.id,
          userId: user.id,
          value: "125000", // CONTINUOUS stored as string
          confidence: 55,
          reasoning: "Seasonality uplift + two new enterprise accounts.",
          method: "Bottom-up model",
          estimatedTime: 20,
        },
        {
          forecastId: f3.id,
          userId: user.id,
          value: "Search Ads", // must match options
          confidence: 60,
          reasoning: "Better intent capture; improved QS from last quarter.",
          method: "Historical comparison",
          estimatedTime: 8,
        },
      ],
    });
    console.log(`✅ Seeded categories, forecasts, and predictions for ${userEmail}`);
  } else {
    console.log("⚠️  Forecasts/predictions already seeded for this organization.");
  }
}

async function main() {
  console.log("🌱 Starting seed...");
  await seedAdmin();
  await seedRegularUser();
  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
