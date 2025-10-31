import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Role } from "@/generated/prisma";
import { requireAuth } from "@/lib/guards";
import { getOrganizationById } from "@/services/organizations";

// Client-only wrapper that renders the chart
import ChartClient from "./_components/chart-client";

// Example: student improves as they submit more forecasts
const accuracyData = [
  { count: 1, accuracy: 48 },
  { count: 2, accuracy: 50 },
  { count: 3, accuracy: 51 },
  { count: 5, accuracy: 55 },
  { count: 8, accuracy: 58 },
  { count: 10, accuracy: 61 },
  { count: 12, accuracy: 63 },
  { count: 15, accuracy: 66 },
  { count: 18, accuracy: 69 },
  { count: 20, accuracy: 71 },
  { count: 24, accuracy: 73 },
  { count: 28, accuracy: 75 },
  { count: 32, accuracy: 77 },
  { count: 36, accuracy: 78 },
  { count: 40, accuracy: 80 },
];

export default async function UserDashboardPage() {
  const session = await requireAuth();
  if (session.user.role !== Role.USER) {
    redirect("/unauthorized");
  }

  console.log("✅ User routed to /dashboard/user:", session.user);

  const orgId = session.user.organizationId ?? null;
  const organization = orgId ? await getOrganizationById(orgId) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to the Player Dashboard!</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            Progress Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartClient data={accuracyData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Organization{" "}
            {organization ? (
              <Badge variant="secondary">Active</Badge>
            ) : (
              <Badge variant="outline">None</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organization ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-lg font-medium">{organization.name}</div>
                <div className="text-sm text-muted-foreground">
                  ID: {organization.id}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <a href="/my-forecasts">My Forecasts</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="/settings">Settings</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                You are not currently assigned to an organization.
              </p>
              <Button asChild size="sm">
                <a href="/join-org">Join an Organization</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
