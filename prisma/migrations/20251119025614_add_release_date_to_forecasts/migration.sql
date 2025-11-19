/*
  Warnings:

  - Added the required column `releaseDate` to the `Forecast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add column with default (current timestamp), then update existing rows, then remove default
ALTER TABLE "Forecast" ADD COLUMN "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to set releaseDate to createdAt for existing forecasts
UPDATE "Forecast" SET "releaseDate" = "createdAt";

-- Remove the default value for future inserts
ALTER TABLE "Forecast" ALTER COLUMN "releaseDate" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Forecast_releaseDate_idx" ON "Forecast"("releaseDate");
