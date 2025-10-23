-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" INTEGER,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prediction_forecastId_idx" ON "Prediction"("forecastId");

-- CreateIndex
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_forecastId_userId_key" ON "Prediction"("forecastId", "userId");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
