// src/app/(protected)/dashboard/layout.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;      // not used, but Next injects it
  orgAdmin: ReactNode;      // from app/(protected)/dashboard/@orgAdmin
  superAdmin: ReactNode;    // from .../@superAdmin
  user: ReactNode;          // from .../@user
};

export default async function DashboardLayout({
  // children, // eslint will yell if unused, feel free to remove from the type + params
  orgAdmin,
  superAdmin,
  user,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    // or your existing protected layout might already handle this
    redirect(Router.SIGN_IN);
  }

  const role = session.user.role as Role;

  if (role === "SUPER_ADMIN") return superAdmin;
  if (role === "ORG_ADMIN") return orgAdmin;

  // Default to regular user dashboard
  return user;
}
