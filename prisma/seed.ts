// prisma/seed.ts
import config from "../src/constants/config";
import {
  DataType,
  ForecastType,
  LedgerKind,
  PrismaClient,
  Role,
} from "../src/generated/prisma";

const prisma = new PrismaClient();
const CENTS = (d: number) => Math.round(d * 100);
const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

async function seedAdmin() {
  const adminEmail = config.nextAuth.adminEmail;

  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL is not set in environment variables");
    process.exit(1);
  }

  console.log(`🌱 Seeding admin user...`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    if (existingAdmin.role !== Role.SUPER_ADMIN) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: Role.SUPER_ADMIN },
      });
      console.log(`🔄 Updated user role to SUPER_ADMIN`);
    }
  } else {
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
}

async function seedRegularUser() {
  const userEmail = "edmiyatake@gmail.com";
  console.log(`🌱 Seeding regular user...`);

  let user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        role: Role.USER,
        name: "Edwin Miyatake",
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Created user: ${userEmail}`);
  } else {
    console.log(`✅ User already exists: ${userEmail}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Ledger seeding (idempotent by memo)
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Organization + membership
  // ─────────────────────────────────────────────────────────────────────────────
  const organization = await prisma.organization.upsert({
    where: { name: "Seeded Test Organization" },
    update: {},
    create: {
      name: "Seeded Test Organization",
      description: "A seeded test organization for dashboard testing",
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: organization.id },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Forecast Categories (composite unique: @@unique([organizationId, name]))
  // ─────────────────────────────────────────────────────────────────────────────
  const [salesCat, marketingCat] = await Promise.all([
    prisma.forecastCategory.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Sales",
        },
      },
      update: {},
      create: {
        name: "Sales",
        color: "#22c55e",
        organizationId: organization.id,
      },
    }),
    prisma.forecastCategory.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Marketing",
        },
      },
      update: {},
      create: {
        name: "Marketing",
        color: "#3b82f6",
        organizationId: organization.id,
      },
    }),
  ]);

  // Guard to avoid duplicating forecasts on repeated seeds
  const existingAnchorForecast = await prisma.forecast.findFirst({
    where: {
      organizationId: organization.id,
      title: "Will we close the MegaCorp deal by month-end?",
    },
  });

  if (!existingAnchorForecast) {
    // ───────────────────────────────────────────────────────────────────────────
    // Forecasts (schema-aligned)
    // ───────────────────────────────────────────────────────────────────────────
    const now = new Date();

    const f1 = await prisma.forecast.create({
      data: {
        title: "Will we close the MegaCorp deal by month-end?",
        description: "Binary forecast about a key enterprise contract.",
        type: ForecastType.BINARY,
        dueDate: addDays(now, 14),
        dataReleaseDate: addDays(now, 16),
        organizationId: organization.id,
        categoryId: salesCat.id,
      },
    });

    const f2 = await prisma.forecast.create({
      data: {
        title: "Q1 Revenue (USD)",
        description: "Continuous forecast of quarterly revenue.",
        type: ForecastType.CONTINUOUS,
        dataType: DataType.CURRENCY, // only for CONTINUOUS
        dueDate: addDays(now, 30),
        dataReleaseDate: addDays(now, 45),
        organizationId: organization.id,
        categoryId: salesCat.id,
      },
    });

    const f3 = await prisma.forecast.create({
      data: {
        title: "Which channel wins Q1 CAC?",
        description: "Categorical: pick the lowest CAC channel.",
        type: ForecastType.CATEGORICAL,
        options: ["Search Ads", "Social Ads", "Email", "Events"], // JSON array
        dueDate: addDays(now, 21),
        dataReleaseDate: addDays(now, 35),
        organizationId: organization.id,
        categoryId: marketingCat.id,
      },
    });

    // ───────────────────────────────────────────────────────────────────────────
    // Predictions for your user (so the UI has “your prediction” data)
    // ───────────────────────────────────────────────────────────────────────────
    await prisma.prediction.createMany({
      data: [
        {
          forecastId: f1.id,
          userId: user.id,
          value: "true", // BINARY expects "true"/"false" as string
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
          value: "Search Ads", // must be one of the options
          confidence: 60,
          reasoning: "Better intent capture; improved QS from last quarter.",
          method: "Historical comparison",
          estimatedTime: 8,
        },
      ],
    });

    console.log(
      `✅ Seeded categories, forecasts, and predictions for ${userEmail}`
    );
  } else {
    console.log("⚠️  Forecasts already seeded for this organization.");
  }
}

async function main() {
  console.log(`🌱 Starting seed...`);

  await seedAdmin();
  await seedRegularUser();

  console.log(`✅ Seeding completed!`);
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
