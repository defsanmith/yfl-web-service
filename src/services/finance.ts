// src/services/finance.ts
import { LedgerKind } from "@/generated/prisma";
import prisma from "@/lib/prisma";

export const CENTS = (d: number) => Math.round(d * 100);

type CreateLedgerEntryParams = {
  userId?: string | null;
  organizationId?: string | null;
  kind: LedgerKind;
  amountCents: number; // + inflow, - outflow (for cash kinds)
  memo?: string | null;
};


/**
 * Low-level helper to insert one ledger row.
 */
export async function createLedgerEntry(
  params: CreateLedgerEntryParams
) {
  const { userId, organizationId, kind, amountCents, memo } = params;

  return prisma.ledgerEntry.create({
    data: {
      userId: userId ?? null,
      organizationId: organizationId ?? null,
      kind,
      amountCents,
      memo: memo ?? null,
    },
  });
}

/**
 * Ensures a user has the default starting money:
 * +$1 Billion Dollars
 */
export async function ensureStartingBalancesForUser(userId: string) {
  const exists = await prisma.ledgerEntry.findFirst({
    where: { userId, memo: "SEED: Starting grant $1 Billion" },
    select: { id: true },
  });

  if (exists) return; // idempotent

  await prisma.ledgerEntry.create({
    data: {
      userId,
      amountCents: CENTS(1_000_000_000), // 1 billion dollars
      kind: LedgerKind.PAYMENT,          // cash inflow
      memo: "SEED: Starting grant $1 Billion",
    },
  });
}

export async function getUserBalanceCents(userId: string): Promise<number> {
  const agg = await prisma.ledgerEntry.aggregate({
    where: {
      userId,
      kind: { in: [LedgerKind.REVENUE, LedgerKind.EXPENSE, LedgerKind.PAYMENT] },
    },
    _sum: { amountCents: true },
  });

  return agg._sum.amountCents ?? 0;
}

export async function getUserBalance(userId: string) {
  const cents = await getUserBalanceCents(userId);
  return cents / 100;
}
