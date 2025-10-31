import { auth } from "@/auth";
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  // Not logged in → go to sign-in page
  if (!session) {
    redirect(Router.SIGN_IN);
  }

  console.log("✅ Logged in user (protected root):", session.user);

  // Redirect user based on their role
  switch (session.user.role) {
    case Role.USER:
      redirect("/dashboard/user");
      break;

    case Role.ORG_ADMIN:
      redirect("/dashboard/admin");
      break;

    case Role.SUPER_ADMIN:
      redirect("/dashboard/super-admin");
      break;

    default:
      redirect(Router.UNAUTHORIZED);
  }
}
