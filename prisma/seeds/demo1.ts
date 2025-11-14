// prisma/seed.ts
import config from "../../src/constants/config";
import {
    PrismaClient,
    Role
} from "../../src/generated/prisma";

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
    console.error("ADMIN_EMAIL is not set in environment variables");
    process.exit(1);
  }

  console.log(`Seeding admin user...`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);
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
    console.log(`Created admin user: ${adminEmail}`);
  }
}

async function main() {
  console.log(`Starting seed...`);

  await seedAdmin();

  console.log(`Seeding completed!`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });