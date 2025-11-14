/**
 * Import forecasts and predictions from CSV files into the database
 * Usage: npx tsx scripts/import-forecasts.ts
 *
 * Requires TEST_USER_EMAIL environment variable
 */

import { DataType, ForecastType, PrismaClient, Role } from "@/generated/prisma";
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

interface PredictionCSVRow {
  method: string;
  reasoning: string;
  estimatedTime: string;
  equityInvestment: string;
  debtFinancing: string;
  value: string;
  confidence: string;
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
 * Parse prediction CSV file
 */
function parsePredictionCSV(filePath: string): PredictionCSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    // Format: method,reasoning,estimatedTime,equityInvestment,debtFinancing,value,confidence
    const parts = [];
    let currentPart = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(currentPart);
        currentPart = "";
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart); // Add last part

    return {
      method: parts[0]?.trim() || "",
      reasoning: parts[1]?.trim() || "",
      estimatedTime: parts[2]?.trim() || "",
      equityInvestment: parts[3]?.trim() || "",
      debtFinancing: parts[4]?.trim() || "",
      value: parts[5]?.trim() || "",
      confidence: parts[6]?.trim() || "",
    };
  });
}

/**
 * Parse date in M/D/YYYY format
 */
function parseDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split("/").map(Number);
  // Set time to noon UTC to avoid timezone issues
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
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
 * Map data type string to Prisma DataType enum
 */
function mapDataType(dataType: string): DataType | null {
  if (!dataType) return null;

  if (dataType.includes("Dollar") || dataType.includes("$"))
    return DataType.CURRENCY;
  if (dataType.includes("Percentage") || dataType.includes("%"))
    return DataType.PERCENT;
  if (dataType.includes("Number")) return DataType.INTEGER;

  return DataType.NUMBER; // Default
}

/**
 * Parse monetary value from CSV (e.g., "$20,000,000" -> 20000000)
 */
function parseMonetaryValue(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[$,]/g, ""));
}

/**
 * Parse confidence percentage (e.g., "95%" -> 95)
 */
function parseConfidence(value: string): number | null {
  if (!value) return null;
  const num = parseFloat(value.replace("%", ""));
  return isNaN(num) ? null : num;
}

/**
 * Normalize prediction value based on forecast type
 */
function normalizePredictionValue(
  value: string,
  forecastType: ForecastType
): string {
  if (!value) return "";

  if (forecastType === ForecastType.BINARY) {
    const lower = value.toLowerCase();
    if (lower === "yes" || lower === "true") return "true";
    if (lower === "no" || lower === "false") return "false";
  }

  // For continuous, remove currency symbols and commas but keep the number
  return value.replace(/[$,]/g, "").trim();
}

/**
 * Get or create user by email
 */
async function getOrCreateUser(email: string, orgId: string) {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        role: Role.USER,
        organizationId: orgId,
      },
    });
    console.log(`  ✓ Created user: ${email}`);
  }

  return user;
}

/**
 * Generate test users with randomized predictions
 */
async function createTestUsers(orgId: string, count: number = 20) {
  const testUsers = [];
  const firstNames = [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve",
    "Frank",
    "Grace",
    "Henry",
    "Iris",
    "Jack",
    "Kate",
    "Liam",
    "Maya",
    "Noah",
    "Olivia",
    "Peter",
    "Quinn",
    "Rachel",
    "Sam",
    "Tina",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
  ];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${
      i > 9 ? i : ""
    }@test.com`;

    const user = await getOrCreateUser(email, orgId);
    testUsers.push(user);
  }

  console.log(`\n✓ Created/verified ${testUsers.length} test users\n`);
  return testUsers;
}

/**
 * Randomize prediction value around base value
 */
function randomizePredictionValue(
  baseValue: string,
  confidence: number | null,
  forecastType: ForecastType
): { value: string; confidence: number | null } {
  if (forecastType === ForecastType.BINARY) {
    // For binary, randomly flip with low probability
    const shouldFlip = Math.random() < 0.15; // 15% chance to flip
    const flippedValue = baseValue === "true" ? "false" : "true";

    // Randomize confidence
    const baseConf = confidence || 75;
    const randomConf = Math.max(
      50,
      Math.min(99, baseConf + (Math.random() - 0.5) * 30)
    );

    return {
      value: shouldFlip ? flippedValue : baseValue,
      confidence: Math.round(randomConf),
    };
  }

  // For continuous, add ±25% variation
  const numValue = parseFloat(baseValue.replace(/[^0-9.-]/g, ""));
  if (isNaN(numValue)) {
    return { value: baseValue, confidence };
  }

  const variation = 0.25;
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
  const newValue = numValue * randomFactor;

  // Handle percentage values
  if (baseValue.includes("%")) {
    return {
      value: `${newValue.toFixed(2)}%`,
      confidence: confidence,
    };
  }

  // Round appropriately based on magnitude
  let roundedValue: string;
  if (Math.abs(newValue) > 1000000) {
    roundedValue = Math.round(newValue).toString();
  } else if (Math.abs(newValue) > 1000) {
    roundedValue = Math.round(newValue).toString();
  } else {
    roundedValue = newValue.toFixed(2);
  }

  return { value: roundedValue, confidence };
}

/**
 * Randomize investment amounts around base values
 */
function randomizeInvestments(
  baseEquity: number,
  baseDebt: number
): { equity: number; debt: number } {
  const variation = 0.4; // ±40% variation

  const equity =
    baseEquity > 0
      ? baseEquity * (1 + (Math.random() - 0.5) * 2 * variation)
      : 0;

  const debt =
    baseDebt > 0 ? baseDebt * (1 + (Math.random() - 0.5) * 2 * variation) : 0;

  return {
    equity: Math.round(equity),
    debt: Math.round(debt),
  };
}
async function getOrCreateCategory(
  orgId: string,
  categoryName: string
): Promise<string> {
  let category = await prisma.forecastCategory.findFirst({
    where: {
      organizationId: orgId,
      name: categoryName,
    },
  });

  if (!category) {
    category = await prisma.forecastCategory.create({
      data: {
        name: categoryName,
        organizationId: orgId,
      },
    });
    console.log(`  ✓ Created category: ${categoryName}`);
  }

  return category.id;
}

async function main() {
  console.log("Starting forecast and prediction import...\n");

  // Check for TEST_USER_EMAIL environment variable
  const testUserEmail = process.env.TEST_USER_EMAIL;
  if (!testUserEmail) {
    console.error("❌ TEST_USER_EMAIL environment variable is required");
    process.exit(1);
  }

  // Get first organization
  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!organization) {
    console.error("❌ No organization found in database.");
    console.error("Please create an organization first.");
    process.exit(1);
  }

  console.log(`Using organization: ${organization.name} (${organization.id})`);
  console.log(`Test user email: ${testUserEmail}\n`);

  // Get or create the test user
  const testUser = await getOrCreateUser(testUserEmail, organization.id);

  // Parse forecast CSV
  const forecastCsvPath = path.join(
    process.cwd(),
    "data",
    "test_forecasts.csv"
  );
  console.log(`Reading forecast CSV: ${forecastCsvPath}`);
  const forecastRows = parseForecastCSV(forecastCsvPath);
  console.log(`Found ${forecastRows.length} forecasts\n`);

  // Parse prediction CSV
  const predictionCsvPath = path.join(process.cwd(), "data", "predictions.csv");
  console.log(`Reading prediction CSV: ${predictionCsvPath}`);
  const predictionRows = parsePredictionCSV(predictionCsvPath);
  console.log(`Found ${predictionRows.length} predictions\n`);

  if (forecastRows.length !== predictionRows.length) {
    console.warn(
      `⚠️  Warning: Forecast count (${forecastRows.length}) doesn't match prediction count (${predictionRows.length})`
    );
  }

  // Create test users
  console.log("Creating test users...");
  const testUsers = await createTestUsers(organization.id, 20);

  let forecastSuccessCount = 0;
  let forecastErrorCount = 0;
  const createdForecasts: Array<{
    id: string;
    title: string;
    type: ForecastType;
  }> = [];

  console.log("Creating forecasts...\n");

  // Process each forecast
  for (const row of forecastRows) {
    try {
      const forecastType = mapForecastType(row.type);
      const dataType =
        forecastType === ForecastType.CONTINUOUS
          ? mapDataType(row.dataType)
          : null;
      const dueDate = parseDate(row.dueDate);
      const dataReleaseDate = parseDate(row.dataReleaseDate);
      const categoryId = await getOrCreateCategory(
        organization.id,
        row.category
      );

      const forecast = await prisma.forecast.create({
        data: {
          title: row.title,
          type: forecastType,
          dataType,
          dueDate,
          dataReleaseDate,
          organizationId: organization.id,
          categoryId,
        },
      });

      createdForecasts.push(forecast);
      console.log(`✓ Created forecast: ${forecast.title.substring(0, 60)}...`);
      forecastSuccessCount++;
    } catch (error) {
      console.error(`✗ Error creating forecast: ${row.title}`);
      console.error(`  ${error}`);
      forecastErrorCount++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Forecast import complete!`);
  console.log(`  ✓ Success: ${forecastSuccessCount}`);
  console.log(`  ✗ Errors: ${forecastErrorCount}`);
  console.log(`${"=".repeat(60)}\n`);

  // Now create predictions for test user and randomized predictions for test users
  let predictionSuccessCount = 0;
  let predictionErrorCount = 0;

  console.log("Creating predictions for test user...\n");

  for (
    let i = 0;
    i < Math.min(createdForecasts.length, predictionRows.length);
    i++
  ) {
    const forecast = createdForecasts[i];
    const predRow = predictionRows[i];

    try {
      // Create prediction for the main test user
      const value = normalizePredictionValue(predRow.value, forecast.type);
      const confidence = parseConfidence(predRow.confidence);
      const equityInvestment = parseMonetaryValue(predRow.equityInvestment);
      const debtFinancing = parseMonetaryValue(predRow.debtFinancing);
      const estimatedTime = predRow.estimatedTime
        ? parseInt(predRow.estimatedTime)
        : null;

      await prisma.prediction.create({
        data: {
          forecastId: forecast.id,
          userId: testUser.id,
          value,
          confidence,
          method: predRow.method || null,
          reasoning: predRow.reasoning || null,
          estimatedTime,
          equityInvestment,
          debtFinancing,
        },
      });

      predictionSuccessCount++;

      // Create randomized predictions for test users
      for (const user of testUsers) {
        const randomized = randomizePredictionValue(
          value,
          confidence,
          forecast.type
        );
        const randomInvestments = randomizeInvestments(
          equityInvestment,
          debtFinancing
        );

        // Random estimated time variation
        const randomTime = estimatedTime
          ? Math.max(5, Math.round(estimatedTime * (0.5 + Math.random())))
          : null;

        await prisma.prediction.create({
          data: {
            forecastId: forecast.id,
            userId: user.id,
            value: randomized.value,
            confidence: randomized.confidence,
            method: predRow.method || null,
            reasoning: null, // Test users don't have reasoning
            estimatedTime: randomTime,
            equityInvestment: randomInvestments.equity,
            debtFinancing: randomInvestments.debt,
          },
        });
      }

      console.log(
        `✓ Created ${
          testUsers.length + 1
        } predictions for: ${forecast.title.substring(0, 50)}...`
      );
    } catch (error) {
      console.error(
        `✗ Error creating predictions for forecast: ${forecast.title}`
      );
      console.error(`  ${error}`);
      predictionErrorCount++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Prediction import complete!`);
  console.log(
    `  ✓ Success: ${predictionSuccessCount} forecasts with predictions`
  );
  console.log(
    `  ✓ Total predictions created: ${
      predictionSuccessCount * (testUsers.length + 1)
    }`
  );
  console.log(`  ✗ Errors: ${predictionErrorCount}`);
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
