-- CreateEnum
CREATE TYPE "LedgerKind" AS ENUM ('REVENUE', 'EXPENSE', 'PAYMENT', 'DEBT');

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "kind" "LedgerKind" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "memo" TEXT,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_occurredAt_idx" ON "LedgerEntry"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_kind_occurredAt_idx" ON "LedgerEntry"("userId", "kind", "occurredAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_organizationId_occurredAt_idx" ON "LedgerEntry"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_organizationId_kind_occurredAt_idx" ON "LedgerEntry"("organizationId", "kind", "occurredAt");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
