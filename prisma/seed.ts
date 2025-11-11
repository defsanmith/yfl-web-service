import config from "../src/constants/config";
import { PrismaClient, Role } from "../src/generated/prisma";

const prisma = new PrismaClient();
const CENTS = (d: number) => Math.round(d * 100);

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

  // Check if the ledger is already seeded
  const already = await prisma.ledgerEntry.findFirst({
    where: { userId: user.id, memo: "SEED: Starting grant $10k" },
  });

  if (already) {
    console.log(`⚠️  Ledger already seeded for ${userEmail}`);
    return;
  }

  // Create starting balance and loan
  await prisma.ledgerEntry.createMany({
    data: [
      {
        userId: user.id,
        amountCents: CENTS(10000),
        kind: "PAYMENT",
        memo: "SEED: Starting grant $10k",
      },
      {
        userId: user.id,
        amountCents: CENTS(10000),
        kind: "PAYMENT",
        memo: "SEED: Loan proceeds $10k",
      },
      {
        userId: user.id,
        amountCents: CENTS(10000),
        kind: "DEBT",
        memo: "SEED: Loan principal $10k (outstanding)",
      },
    ],
  });

  console.log(`💰 Seeded ledger for ${userEmail}`);
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
