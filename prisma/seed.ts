import { PrismaClient, Role } from "../src/generated/prisma";
import config from "../src/constants/config";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = config.nextAuth.adminEmail;

  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL is not set in environment variables");
    process.exit(1);
  }

  console.log(`🌱 Seeding database...`);

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);

    // Update role to SUPER_ADMIN if it's not already
    if (existingAdmin.role !== Role.SUPER_ADMIN) {
      const updatedAdmin = await prisma.user.update({
        where: { email: adminEmail },
        data: { role: Role.SUPER_ADMIN },
      });
      console.log(`🔄 Updated user role to SUPER_ADMIN`);
      console.log(updatedAdmin);
    } else {
      console.log(existingAdmin);
    }
  } else {
    // Create new admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        role: Role.SUPER_ADMIN,
        emailVerified: new Date(), // Mark as verified so they can login
        name: "Super Admin",
      },
    });

    console.log(`✅ Created admin user: ${adminEmail}`);
    console.log(adminUser);
  }

  console.log(`🌱 Seeding completed!`);
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
