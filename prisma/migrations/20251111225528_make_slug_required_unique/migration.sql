/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,title]` on the table `Forecast` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Forecast` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Forecast" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_organizationId_title_key" ON "Forecast"("organizationId", "title");
