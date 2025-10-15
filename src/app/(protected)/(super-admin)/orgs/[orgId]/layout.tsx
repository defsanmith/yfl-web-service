import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import { getOrganizationById } from "@/services/organizations";
import OrganizationLayoutView from "@/views/organizations/OrganizationLayoutView";
import { notFound } from "next/navigation";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  await requireRole([Role.SUPER_ADMIN]);

  const { orgId } = await params;

  // Fetch organization details
  const organization = await getOrganizationById(orgId);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationLayoutView
      organization={{
        id: organization.id,
        name: organization.name,
        description: organization.description,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      }}
      userCount={organization.users.length}
    >
      {children}
    </OrganizationLayoutView>
  );
}
