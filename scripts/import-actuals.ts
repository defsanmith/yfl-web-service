/**
 * Import actual values for forecasts from CSV file
 * Usage: npx tsx scripts/import-actuals.ts
 *
 * This script updates forecasts with their actual values and triggers
 * automatic recalculation of all prediction metrics.
 * The rows in actuals.csv correspond to forecasts in test_forecasts.csv by order.
 */

import { ForecastType, PrismaClient } from "@/generated/prisma";
import { setActualValue } from "@/services/forecasts";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ForecastCSVRow {
  title: string;
  type: string;
  dataType: string;
  dueDate: string;
  dataReleaseDate: string;
  category: string;
}

/**
 * Parse forecast CSV file manually (handles commas in titles)
 */
function parseForecastCSV(filePath: string): ForecastCSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    // Split from the right to handle commas in title
    // Format: title,type,dataType,dueDate,dataReleaseDate,category
    const parts = [];
    let currentPart = "";
    let commaCount = 0;

    // Count from the end - we expect 5 commas total
    for (let i = line.length - 1; i >= 0; i--) {
      if (line[i] === "," && commaCount < 5) {
        commaCount++;
        if (commaCount <= 5) {
          parts.unshift(currentPart);
          currentPart = "";
          continue;
        }
      }
      currentPart = line[i] + currentPart;
    }
    parts.unshift(currentPart); // Add remaining as title

    return {
      title: parts[0].trim(),
      type: parts[1].trim(),
      dataType: parts[2].trim(),
      dueDate: parts[3].trim(),
      dataReleaseDate: parts[4].trim(),
      category: parts[5].trim(),
    };
  });
}

/**
 * Parse actuals CSV file (simple single column format)
 */
function parseActualsCSV(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    // Remove surrounding quotes if present
    return line.trim().replace(/^"|"$/g, "");
  });
}

/**
 * Map CSV type to Prisma ForecastType enum
 */
function mapForecastType(type: string): ForecastType {
  if (type === "BINARY") return ForecastType.BINARY;
  if (type === "CONTINOUS") return ForecastType.CONTINUOUS; // Handle typo in CSV
  if (type === "CONTINUOUS") return ForecastType.CONTINUOUS;
  if (type === "CATEGORICAL") return ForecastType.CATEGORICAL;
  throw new Error(`Unknown forecast type: ${type}`);
}

/**
 * Normalize actual value based on forecast type
 */
function normalizeActualValue(
  value: string,
  forecastType: ForecastType
): string {
  if (!value) return "";

  if (forecastType === ForecastType.BINARY) {
    const lower = value.toLowerCase();
    if (lower === "yes" || lower === "true") return "true";
    if (lower === "no" || lower === "false") return "false";
  }

  // For continuous, keep the value as-is (with $ and commas removed for storage)
  return value.replace(/[$,]/g, "").trim();
}

async function main() {
  console.log("Starting actuals import...\n");

  // Get first organization
  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!organization) {
    console.error("❌ No organization found in database.");
    console.error("Please create an organization first.");
    process.exit(1);
  }

  console.log(
    `Using organization: ${organization.name} (${organization.id})\n`
  );

  // Parse forecast CSV to get the order and types
  const forecastCsvPath = path.join(
    process.cwd(),
    "data",
    "test_forecasts.csv"
  );
  console.log(`Reading forecast CSV: ${forecastCsvPath}`);
  const forecastRows = parseForecastCSV(forecastCsvPath);
  console.log(`Found ${forecastRows.length} forecast definitions\n`);

  // Parse actuals CSV
  const actualsCsvPath = path.join(process.cwd(), "data", "actuals.csv");
  console.log(`Reading actuals CSV: ${actualsCsvPath}`);
  const actualValues = parseActualsCSV(actualsCsvPath);
  console.log(`Found ${actualValues.length} actual values\n`);

  if (forecastRows.length !== actualValues.length) {
    console.error(
      `❌ Mismatch: ${forecastRows.length} forecasts but ${actualValues.length} actuals`
    );
    process.exit(1);
  }

  // Get all forecasts from database
  const allForecasts = await prisma.forecast.findMany({
    where: { organizationId: organization.id },
  });

  console.log(`Found ${allForecasts.length} forecasts in database\n`);

  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;

  console.log("Updating forecasts with actual values (matching by title)...\n");
  console.log("(This will automatically recalculate prediction metrics)\n");

  // Update each forecast by matching title
  for (let i = 0; i < forecastRows.length; i++) {
    const forecastRow = forecastRows[i];
    const actualValue = actualValues[i];

    // Find forecast in database by title (case-insensitive)
    const forecast = allForecasts.find(
      (f) => f.title.toLowerCase() === forecastRow.title.toLowerCase()
    );

    if (!forecast) {
      console.warn(
        `⚠ Forecast not found in database: ${forecastRow.title.substring(
          0,
          60
        )}...`
      );
      notFoundCount++;
      continue;
    }

    try {
      const forecastType = mapForecastType(forecastRow.type);
      const normalizedValue = normalizeActualValue(actualValue, forecastType);

      // Use the setActualValue service method which handles:
      // 1. Updating the forecast's actualValue
      // 2. Updating dueDate/dataReleaseDate if needed
      // 3. Recalculating metrics for all predictions via PredictionMetricsService
      await setActualValue({
        id: forecast.id,
        actualValue: normalizedValue,
        type: forecastType,
      });

      console.log(
        `✓ Updated forecast: ${forecast.title.substring(
          0,
          50
        )}... => ${actualValue}`
      );
      successCount++;
    } catch (error) {
      console.error(`✗ Error updating forecast: ${forecast.title}`);
      console.error(`  ${error}`);
      errorCount++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Actuals import complete!`);
  console.log(`  ✓ Success: ${successCount}`);
  console.log(`  ✗ Errors: ${errorCount}`);
  if (notFoundCount > 0) {
    console.log(`  ⚠ Not found: ${notFoundCount}`);
  }
  console.log(`${"=".repeat(60)}\n`);
  console.log(
    "✓ All prediction metrics have been recalculated automatically\n"
  );
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
