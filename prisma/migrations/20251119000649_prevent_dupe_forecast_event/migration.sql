/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,title]` on the table `Forecast` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Forecast_organizationId_title_key" ON "Forecast"("organizationId", "title");
