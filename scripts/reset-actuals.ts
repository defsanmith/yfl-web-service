/**
 * Reset actual values for all forecasts
 * Usage: npx tsx scripts/reset-actuals.ts
 *
 * This script removes all actual values from forecasts and clears
 * all prediction metrics (since they depend on actual values).
 */

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting actuals reset...\n");

  // Get first organization
  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!organization) {
    console.error("❌ No organization found in database.");
    process.exit(1);
  }

  console.log(
    `Using organization: ${organization.name} (${organization.id})\n`
  );

  // Get all forecasts
  const forecasts = await prisma.forecast.findMany({
    where: { organizationId: organization.id },
    select: { id: true, title: true },
  });

  console.log(`Found ${forecasts.length} forecasts\n`);

  let forecastSuccessCount = 0;
  let forecastErrorCount = 0;

  console.log("Clearing actual values from forecasts...\n");

  // Clear actual values from all forecasts
  for (const forecast of forecasts) {
    try {
      await prisma.forecast.update({
        where: { id: forecast.id },
        data: { actualValue: null },
      });

      console.log(
        `✓ Cleared actual value: ${forecast.title.substring(0, 60)}...`
      );
      forecastSuccessCount++;
    } catch (error) {
      console.error(`✗ Error clearing forecast: ${forecast.title}`);
      console.error(`  ${error}`);
      forecastErrorCount++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Forecast actuals cleared!`);
  console.log(`  ✓ Success: ${forecastSuccessCount}`);
  console.log(`  ✗ Errors: ${forecastErrorCount}`);
  console.log(`${"=".repeat(60)}\n`);

  // Clear all prediction metrics
  console.log("Clearing prediction metrics...\n");

  try {
    const result = await prisma.prediction.updateMany({
      data: {
        isCorrect: null,
        highLow: null,
        ppVariance: null,
        error: null,
        brierScore: null,
        absoluteError: null,
        absoluteActualErrorPct: null,
        absoluteForecastErrorPct: null,
        roiScore: null,
        roe: null,
        roePct: null,
        financingGrossProfit: null,
        debtRepayment: null,
        rof: null,
        rofPct: null,
        netProfitEquityPlusDebt: null,
        roiEquityPlusDebtPct: null,
        profitPerHour: null,
      },
    });

    console.log(`✓ Cleared metrics for ${result.count} predictions\n`);
  } catch (error) {
    console.error(`✗ Error clearing prediction metrics: ${error}\n`);
  }

  console.log(`${"=".repeat(60)}`);
  console.log("Reset complete!");
  console.log("All actual values and prediction metrics have been cleared.");
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
