// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { getForecastCounts, getUserFinanceStats } from "@/services/dashboard";
import UserDashboardView from "@/views/home/UserDashboardView";
import { redirect } from "next/navigation";

/**
 * Format numbers as whole-dollar USD strings.
 */
const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default async function UserDashboardPage() {
  // 1️⃣  Authenticate user (server-side)
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  const userId = session.user.id!;
  const orgId = session.user.organizationId ?? null;

  // 2️⃣  Fallback display name
  const displayName =
    session.user.name ??
    (session.user.email ? session.user.email.split("@")[0] : "Player");

  // 3️⃣  Query Prisma for finance + forecast data
  const [fin, counts] = await Promise.all([
    getUserFinanceStats(userId),
    orgId
      ? getForecastCounts(orgId, userId)
      : Promise.resolve({ orgCount: 0, userCount: 0 }),
  ]);

  // 4️⃣  Build KPI cards (matches your dashboard view)
  const kpis = [
    {
      id: "forecasts",
      label: "Total Forecasts",
      value: counts.userCount ?? 0, // change to orgCount for org-level
      subLabel: "Forecasts created by you",
      up: true,
      delta: "+0%",
    },
    {
      id: "balance",
      label: "Current Balance",
      value: currency(fin.balance),
      subLabel: "Available account balance",
      up: true,
      delta: "+0%",
    },
    {
      id: "loan",
      label: "Loan Balance",
      value: currency(fin.debt),
      subLabel: "Outstanding loan amount",
      up: false,
      delta: "-0%",
    },
    {
      id: "revenue",
      label: "Revenue (MTD)",
      value: currency(fin.mtdRevenue),
      subLabel: "Month-to-date revenue",
      up: true,
      delta: "+0%",
    },
  ];

  // 5️⃣  Render client dashboard view
  return <UserDashboardView userName={displayName} stats={kpis} />;
}
