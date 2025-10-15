-- CreateEnum
CREATE TYPE "ForecastType" AS ENUM ('BINARY', 'CONTINUOUS', 'CATEGORICAL');

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ForecastType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Forecast_organizationId_idx" ON "Forecast"("organizationId");

-- CreateIndex
CREATE INDEX "Forecast_type_idx" ON "Forecast"("type");

-- CreateIndex
CREATE INDEX "Forecast_dueDate_idx" ON "Forecast"("dueDate");

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
