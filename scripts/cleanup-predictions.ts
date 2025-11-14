/**
 * Remove predictions for specific users (like org admins who shouldn't be in leaderboard)
 * Usage: npx tsx scripts/cleanup-predictions.ts [email1] [email2] ...
 *
 * If no emails provided, removes predictions for all ORG_ADMIN and SUPER_ADMIN users
 */

import { PrismaClient, Role } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  let usersToCleanup;

  if (args.length > 0) {
    // Clean up specific users by email
    console.log(`Cleaning up predictions for: ${args.join(", ")}\n`);
    usersToCleanup = await prisma.user.findMany({
      where: {
        email: { in: args },
      },
      select: { id: true, email: true, role: true },
    });
  } else {
    // Clean up all admin users
    console.log(
      "Cleaning up predictions for all ORG_ADMIN and SUPER_ADMIN users\n"
    );
    usersToCleanup = await prisma.user.findMany({
      where: {
        role: { in: [Role.ORG_ADMIN, Role.SUPER_ADMIN] },
      },
      select: { id: true, email: true, role: true },
    });
  }

  if (usersToCleanup.length === 0) {
    console.log("No users found to clean up.");
    return;
  }

  console.log(`Found ${usersToCleanup.length} users:\n`);
  usersToCleanup.forEach((user) => {
    console.log(`  - ${user.email} (${user.role})`);
  });
  console.log();

  let totalDeleted = 0;

  for (const user of usersToCleanup) {
    const result = await prisma.prediction.deleteMany({
      where: { userId: user.id },
    });

    console.log(`✓ Deleted ${result.count} predictions for ${user.email}`);
    totalDeleted += result.count;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Cleanup complete!`);
  console.log(`  ✓ Total predictions deleted: ${totalDeleted}`);
  console.log(`${"=".repeat(60)}\n`);
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
