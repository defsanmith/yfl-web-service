// src/app/signin/page.tsx
import { auth } from "@/auth";
import Router from "@/constants/router";
import SignInView from "@/views/auth/SignInView";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (session) redirect(Router.DASHBOARD);

  // Await searchParams before using it
  const params = await searchParams;
  const rawError = params?.error;
  const error =
    typeof rawError === "string"
      ? rawError
      : Array.isArray(rawError)
      ? rawError[0]
      : undefined;

  // ⬇️ This is the key change: handle EmailSignin as "unauthorized email"
  if (error) {
    console.log("🔍 [SignInPage] NextAuth error code:", error);
  }
  
  if (error === "AccessDenied" || error === "EmailSignin") {
    redirect("/unauthorized-email");
    // or redirect(Router.UNAUTHORIZED) if you have that constant
  }

  return <SignInView error={error} />;
}
