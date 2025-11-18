import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRouterPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  console.log("[DashboardRouterPage] session.user =", session?.user);

  const role = session.user.role;
  switch (role) {
    case "SUPER_ADMIN":
      redirect("/dashboard/super-admin");
    case "ORG_ADMIN":
      redirect("/dashboard/org-admin");
    default:
      redirect("/dashboard/user");
  }
}
