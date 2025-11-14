/*
 Warnings:
 
 - You are about to drop the column `slug` on the `Forecast` table. All the data in the column will be lost.
 
 */
-- DropIndex
DROP INDEX IF EXISTS "public"."Forecast_organizationId_slug_key";
-- AlterTable
ALTER TABLE "public"."Forecast" DROP COLUMN IF EXISTS "slug";