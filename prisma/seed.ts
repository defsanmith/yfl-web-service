// prisma/seed.ts

import { PrismaClient, Role } from "../src/generated/prisma";

const prisma = new PrismaClient();

// ───────────────────────────────────────────────────────────────────────────────
// Seed 5 demo super admins (no passwords, email-only auth)
// ───────────────────────────────────────────────────────────────────────────────
async function seedSuperAdmins() {
  const superAdminEmails = [
    "emiyatak@uci.edu",
    "sbkurian@uci.edu",
    "snagras@uci.edu",
    "dss@competitiveanalytics.com",
    "mp@competitiveanalytics.com",
  ];

  console.log("🌱 Seeding demo super admin users...");

  for (const email of superAdminEmails) {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Ensure they are SUPER_ADMIN
      if (existing.role !== Role.SUPER_ADMIN) {
        await prisma.user.update({
          where: { email },
          data: { role: Role.SUPER_ADMIN },
        });
        console.log(`🔄 Updated ${email} to SUPER_ADMIN`);
      } else {
        console.log(`✅ Super admin already exists: ${email}`);
      }
    } else {
      await prisma.user.create({
        data: {
          email,
          role: Role.SUPER_ADMIN,
          emailVerified: new Date(),
          name: email.split("@")[0], // simple demo name
        },
      });
      console.log(`✅ Created demo super admin: ${email}`);
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Entry point
// ───────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting seed...");
  await seedSuperAdmins();
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
