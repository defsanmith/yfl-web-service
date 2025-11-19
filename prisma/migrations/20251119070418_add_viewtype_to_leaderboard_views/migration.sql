/*
  Warnings:

  - A unique constraint covering the columns `[userId,name,viewType]` on the table `LeaderboardView` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeaderboardViewType" AS ENUM ('USER', 'PREDICTION', 'CATEGORY');

-- DropIndex
DROP INDEX "public"."Forecast_organizationId_title_key";

-- DropIndex
DROP INDEX "public"."LeaderboardView_userId_name_key";

-- AlterTable
ALTER TABLE "LeaderboardView" ADD COLUMN     "viewType" "LeaderboardViewType" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "LeaderboardView_userId_viewType_idx" ON "LeaderboardView"("userId", "viewType");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardView_userId_name_viewType_key" ON "LeaderboardView"("userId", "name", "viewType");
