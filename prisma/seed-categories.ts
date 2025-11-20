/**
 * Migration script to add predefined categories to existing organizations
 *
 * Run this script once to add the predefined categories (Movies, Crypto, etc.)
 * to all existing organizations in the database.
 *
 * Usage:
 *   npx tsx prisma/seed-categories.ts
 */

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

const PREDEFINED_CATEGORIES = [
  { name: "Movies", color: "#E11D48" },
  { name: "Crypto", color: "#F59E0B" },
  { name: "Automobiles", color: "#3B82F6" },
  { name: "Stock Market", color: "#10B981" },
  { name: "Corp. Earnings", color: "#8B5CF6" },
];

async function seedCategories() {
  console.log("🌱 Starting category seeding for existing organizations...\n");

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    if (organizations.length === 0) {
      console.log("ℹ️  No organizations found. Nothing to seed.");
      return;
    }

    console.log(`📊 Found ${organizations.length} organization(s)\n`);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const org of organizations) {
      console.log(`\n🏢 Processing: ${org.name}`);

      // Check existing categories for this organization
      const existingCategories = await prisma.forecastCategory.findMany({
        where: { organizationId: org.id },
        select: { name: true },
      });

      const existingNames = new Set(
        existingCategories.map((c) => c.name.toLowerCase())
      );

      // Create missing categories
      for (const category of PREDEFINED_CATEGORIES) {
        if (existingNames.has(category.name.toLowerCase())) {
          console.log(`  ⏭️  Skipped: ${category.name} (already exists)`);
          totalSkipped++;
        } else {
          await prisma.forecastCategory.create({
            data: {
              name: category.name,
              color: category.color,
              organizationId: org.id,
            },
          });
          console.log(`  ✅ Created: ${category.name}`);
          totalCreated++;
        }
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✨ Seeding complete!");
    console.log(`📈 Categories created: ${totalCreated}`);
    console.log(`⏭️  Categories skipped: ${totalSkipped}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Error seeding categories:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories().catch((error) => {
  console.error(error);
  process.exit(1);
});
