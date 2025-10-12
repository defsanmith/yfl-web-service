import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import { getOrganizationById } from "@/services/organizations";
import { notFound } from "next/navigation";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  // Verify user is SUPER_ADMIN
  await requireRole([Role.SUPER_ADMIN]);

  const { orgId } = await params;

  // Fetch organization details
  const organization = await getOrganizationById(orgId);

  if (!organization) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl">{organization.name}</CardTitle>
            <CardDescription className="mt-2">
              {organization.description || "No description provided"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {organization.users.length}{" "}
            {organization.users.length === 1 ? "User" : "Users"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Organization Info */}
          <div className="grid gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Organization ID</h3>
              <p className="text-sm text-muted-foreground font-mono">
                {organization.id}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Created</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(organization.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Last Updated</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(organization.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Users List */}
          {organization.users.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Members</h3>
              <div className="space-y-2">
                {organization.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name || "No name"}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
