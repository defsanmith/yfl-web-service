import { auth } from "@/auth";
import Router from "@/constants/router";
import { redirect } from "next/navigation";

export default async function ProtectedRootPage() {
  const session = await auth();

  // Not authenticated → go to sign in
  if (!session) {
    redirect(Router.SIGN_IN);
  }

  console.log("[ProtectedRootPage] session.user =", session.user);

  // All roles now use the same dashboard entry point
  redirect(Router.DASHBOARD);
}
