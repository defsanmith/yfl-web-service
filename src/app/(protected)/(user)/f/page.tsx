// File: app/(protected)/(user)/player/page.tsx
// Minimal, clean player dashboard using shadcn/ui + Recharts
// - Shows a performance chart (weekly)
// - Shows the user's organization (if any)
//
// Assumes you have:
//  - shadcn/ui installed
//  - Recharts installed: `npm i recharts`
//  - Tailwind configured
//  - Guards/services available at the given import paths

import { redirect } from "next/navigation";

// If you have a player-only guard, prefer that
// Otherwise, swap `requirePlayer` with your own auth/session fetch
import { Role } from "@/generated/prisma"; // fallback to `auth()` if needed
import { requireAuth } from "@/lib/guards";
import { getOrganizationById } from "@/services/organizations";

// shadcn/ui
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Recharts
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// ----------------------
// Mock/fallback data
// ----------------------
const weeklyData = [
  { day: "Sun", theory: 22, practice: 30, lexicon: 18 },
  { day: "Mon", theory: 28, practice: 36, lexicon: 20 },
  { day: "Tue", theory: 35, practice: 44, lexicon: 26 },
  { day: "Wed", theory: 40, practice: 52, lexicon: 32 },
  { day: "Thu", theory: 48, practice: 64, lexicon: 38 },
  { day: "Fri", theory: 46, practice: 58, lexicon: 36 },
  { day: "Sat", theory: 50, practice: 62, lexicon: 40 },
];

// Optional: nice subtle gradients
const GradientDefs = () => (
  <svg width={0} height={0}>
    <defs>
      <linearGradient id="gradTheory" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} />
        <stop offset="95%" stopColor="currentColor" stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id="gradPractice" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} />
        <stop offset="95%" stopColor="currentColor" stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id="gradLexicon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} />
        <stop offset="95%" stopColor="currentColor" stopOpacity={0.05} />
      </linearGradient>
    </defs>
  </svg>
);

// Custom tooltip styled to feel like shadcn
const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload.reduce((acc: any, cur: any) => ({ ...acc, [cur.name]: cur.value }), {});
  return (
    <div className="rounded-xl border bg-background/95 p-3 shadow-sm">
      <div className="text-sm font-medium">Performance</div>
      <Separator className="my-2" />
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Theory</span><span className="font-medium">{p.Theory}</span></div>
        <div className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Practice</span><span className="font-medium">{p.Practice}</span></div>
        <div className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Lexicon</span><span className="font-medium">{p.Lexicon}</span></div>
      </div>
    </div>
  );
};

// ----------------------
// Page Component
// ----------------------
export default async function PlayerDashboardPage() {
  const session = await requireAuth();

  // Only allow role = USER to view this dashboard
  if (session.user.role !== Role.USER) {
    redirect("/unauthorized");
  }
  if (!session) redirect("/api/auth/signin");

  const orgId = session.user.organizationId ?? null;
  const organization = orgId ? await getOrganizationById(orgId) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Player Dashboard</h1>
        <p className="text-muted-foreground">Track results and watch your progress rise.</p>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Performance Chart</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" /> Theory
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-500" /> Practice
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> Lexicon
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
                <GradientDefs />
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} dy={6} className="text-muted-foreground" />
                <YAxis tickLine={false} axisLine={false} dx={-6} className="text-muted-foreground" />
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="top" height={0} />
                <Area type="monotone" dataKey="theory" name="Theory" stroke="currentColor" fill="url(#gradTheory)" strokeWidth={2} className="text-primary" />
                <Area type="monotone" dataKey="practice" name="Practice" stroke="currentColor" fill="url(#gradPractice)" strokeWidth={2} className="text-purple-500" />
                <Area type="monotone" dataKey="lexicon" name="Lexicon" stroke="currentColor" fill="url(#gradLexicon)" strokeWidth={2} className="text-orange-500" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Organization Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Organization {organization ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">None</Badge>}</CardTitle>
        </CardHeader>
        <CardContent>
          {organization ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-lg font-medium">{organization.name}</div>
                <div className="text-sm text-muted-foreground">ID: {organization.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm"><a href="/my-forecasts">My Forecasts</a></Button>
                <Button asChild size="sm" variant="outline"><a href="/settings">Settings</a></Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">You are not currently assigned to an organization.</p>
              <Button asChild size="sm"><a href="/join-org">Join an Organization</a></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
