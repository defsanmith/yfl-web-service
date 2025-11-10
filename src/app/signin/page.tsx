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
  if (session) redirect(Router.HOME);

  // 👇 Await searchParams before using its properties
  const params = await searchParams;
  const rawError = params?.error;
  const error = typeof rawError === "string" ? rawError : undefined;

  return <SignInView error={error} />;
}
