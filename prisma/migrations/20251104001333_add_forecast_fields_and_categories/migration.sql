-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('NUMBER', 'CURRENCY', 'PERCENT', 'DECIMAL', 'INTEGER');

-- AlterTable
ALTER TABLE "Forecast" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "dataReleaseDate" TIMESTAMP(3),
ADD COLUMN     "dataType" "DataType";

-- CreateTable
CREATE TABLE "ForecastCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastCategory_organizationId_idx" ON "ForecastCategory"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastCategory_organizationId_name_key" ON "ForecastCategory"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Forecast_categoryId_idx" ON "Forecast"("categoryId");

-- AddForeignKey
ALTER TABLE "ForecastCategory" ADD CONSTRAINT "ForecastCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ForecastCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
