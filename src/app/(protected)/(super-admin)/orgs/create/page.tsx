import { Role } from "@/generated/prisma";
import { requireRole } from "@/lib/guards";
import CreateOrganizationView from "@/views/organizations/CreateOrganizationView";

export default async function CreateOrganizationPage() {
  // Verify user is SUPER_ADMIN before rendering the form
  await requireRole([Role.SUPER_ADMIN]);

  return <CreateOrganizationView />;
}
