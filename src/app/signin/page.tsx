import { auth } from "@/auth";
import Router from "@/constants/router";
import SignInView from "@/views/auth/SignInView";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (session) {
    redirect(Router.HOME);
  }

  const rawError = searchParams?.error;
  const error = typeof rawError === "string" ? rawError : undefined;

  return <SignInView error={error} />;
}

