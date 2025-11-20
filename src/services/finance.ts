// src/services/finance.ts
import prisma from "@/lib/prisma";

const CENTS = (d: number) => Math.round(d * 100);

/**
 * Ensures a user has the default starting money:
 * +$10,000 cash (grant), +$10,000 cash (loan proceeds), +$10,000 debt (outstanding).
 * Safe to call multiple times (idempotent).
 */
export async function ensureStartingBalancesForUser(userId: string) {
  const exists = await prisma.ledgerEntry.findFirst({
    where: { userId, memo: "SEED: Starting grant $10k" },
    select: { id: true },
  });
  if (exists) return;

  await prisma.ledgerEntry.createMany({
    data: [
      {
        userId,
        amountCents: CENTS(10000),
        kind: "PAYMENT",
        memo: "SEED: Starting grant $10k",
      },
      {
        userId,
        amountCents: CENTS(10000),
        kind: "PAYMENT",
        memo: "SEED: Loan proceeds $10k",
      },
      {
        userId,
        amountCents: CENTS(10000),
        kind: "DEBT",
        memo: "SEED: Loan principal $10k (outstanding)",
      },
    ],
  });
}

export async function getUserBalance(userId: string) {
  // Fetch all ledger entries for this user
  const entries = await prisma.ledgerEntry.findMany({
    where: { userId },
    select: { amountCents: true, kind: true },
  });

  let totalCents = 0;

  for (const e of entries) {
    if (e.kind === "PAYMENT" || e.kind === "REVENUE") {
      totalCents += e.amountCents;
    } else if (e.kind === "EXPENSE" || e.kind === "DEBT") {
      totalCents -= e.amountCents;
    }
  }

  // Convert to dollars
  return totalCents / 100;
}
