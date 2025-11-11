import prisma from "@/lib/prisma";
import { startOfMonth } from "date-fns";

export type UserFinanceStats = {
  balance: number;    // dollars
  debt: number;       // dollars
  mtdRevenue: number; // dollars
};

export async function getUserFinanceStats(userId: string): Promise<UserFinanceStats> {
  const [balanceAgg, debtAgg, revenueAgg] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { userId, NOT: { kind: "DEBT" } }, // cash-only kinds
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { userId, kind: "DEBT", settledAt: null }, // outstanding only
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        userId,
        kind: "REVENUE",
        occurredAt: { gte: startOfMonth(new Date()) },
      },
      _sum: { amountCents: true },
    }),
  ]);

  return {
    balance: (balanceAgg._sum.amountCents ?? 0) / 100,
    debt: (debtAgg._sum.amountCents ?? 0) / 100,
    mtdRevenue: (revenueAgg._sum.amountCents ?? 0) / 100,
  };
}

export async function getForecastCounts(organizationId: string, userId?: string) {
  const [orgCount, userCount] = await Promise.all([
    prisma.forecast.count({ where: { organizationId } }),
    userId
      ? prisma.forecast.count({
          where: { organizationId, predictions: { some: { userId } } },
        })
      : Promise.resolve(0),
  ]);

  return { orgCount, userCount };
}
