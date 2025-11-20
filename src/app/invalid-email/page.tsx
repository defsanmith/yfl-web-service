// src/app/invalid-magic-url/page.tsx
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Router from "@/constants/router";
import Link from "next/link";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function InvalidMagicUrlPage({ searchParams }: PageProps) {
  const session = await auth();
  const error = (await searchParams)?.error;

  // NextAuth sends `error=Verification` for invalid/expired magic links
  const isInvalidMagicLink = error === "Verification";

  const heading = isInvalidMagicLink
    ? "This magic link is no longer valid"
    : "Something went wrong";

  const message = isInvalidMagicLink
    ? "The sign-in link you used is invalid, expired, or has already been used."
    : "We couldn't complete your sign-in. Please try again.";

  // If logged in → send them “home”, otherwise → send them to signup
  const ctaHref = session?.user ? Router.HOME : Router.SIGN_IN;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="max-w-md rounded-xl border bg-background p-8 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>

        <p className="text-xs text-muted-foreground">
          You can always request a new magic link from the sign-in page.
        </p>

        <div className="pt-4">
          <Link href={ctaHref}>
            <Button className="w-full">Go to homepage</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
