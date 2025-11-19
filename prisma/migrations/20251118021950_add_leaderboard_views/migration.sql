/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,title]` on the table `Forecast` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "LeaderboardView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sortBy" TEXT,
    "sortOrder" TEXT,
    "columnVisibility" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardView_userId_idx" ON "LeaderboardView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardView_userId_name_key" ON "LeaderboardView"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_organizationId_title_key" ON "Forecast"("organizationId", "title");

-- AddForeignKey
ALTER TABLE "LeaderboardView" ADD CONSTRAINT "LeaderboardView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
