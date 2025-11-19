// src/app/(protected)/(dashboard)/layout.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;      // main slot (can be null/empty)
  user: ReactNode;          // from @user
  orgAdmin: ReactNode;      // from @orgAdmin
  superAdmin: ReactNode;    // from @superAdmin
};

export default async function DashboardLayout({
  children,
  user,
  orgAdmin,
  superAdmin,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect(Router.SIGN_IN);
  }

  const role = session.user.role as Role;

  if (role === Role.SUPER_ADMIN) {
    return superAdmin ?? children;
  }

  if (role === Role.ORG_ADMIN) {
    return orgAdmin ?? children;
  }

  // Default: regular USER
  return user ?? children;
}
