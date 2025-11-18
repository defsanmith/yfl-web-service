import { auth } from "@/auth";
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    sortBy?: string;
    sortOrder?: string;
  }>;
};

export default async function ProtectedRootPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  console.log("[ProtectedRootPage] session.user =", session.user);

  // Super Admin → their dashboard
  if (session.user.role === Role.SUPER_ADMIN) {
    redirect(Router.DASHBOARD_SUPER_ADMIN);
  }

  // Org Admin → org admin dashboard
  if (session.user.role === Role.ORG_ADMIN) {
    redirect(Router.DASHBOARD_ORG_ADMIN);
  }

  // Regular user → user dashboard view
  redirect(Router.DASHBOARD_USER);
}
