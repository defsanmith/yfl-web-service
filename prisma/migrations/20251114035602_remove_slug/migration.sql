/*
  Warnings:

  - You are about to drop the column `slug` on the `Forecast` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Forecast_organizationId_slug_key";

-- AlterTable
ALTER TABLE "Forecast" DROP COLUMN "slug";
