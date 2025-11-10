// src/app/(protected)/(user)/dashboard/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import UserDashboardView from "@/views/home/UserDashboardView";
import { redirect } from "next/navigation";

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session) redirect(Router.SIGN_IN);

  return <UserDashboardView />;
}
