-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "debtFinancing" DOUBLE PRECISION,
ADD COLUMN     "equityInvestment" DOUBLE PRECISION,
ADD COLUMN     "estimatedTime" INTEGER,
ADD COLUMN     "method" TEXT;
