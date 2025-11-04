"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Router from "@/constants/router";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";

// --- Validation ---
const EmailSchema = z.string().email("Please enter a valid email.");

// --- Action state shape (matches the template’s contract) ---
type ActionState = {
  success?: boolean;
  data?: { email?: string };
  errors?: {
    _form?: string[];
    email?: string[];
  };
};

const initialActionState: ActionState = { data: { email: "" } };

// --- Server action (client-executed) ---
async function requestMagicLinkAction(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const raw = (formData.get("email") as string | null) ?? "";
    const email = raw.trim();

    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      return {
        data: { email },
        errors: { email: [parsed.error.issues[0]?.message ?? "Invalid email."] },
      };
    }

    const callbackUrl =
      (formData.get("callbackUrl") as string | null) ?? Router.HOME;

    const res = await signIn("email", {
      email: parsed.data,
      callbackUrl,
      redirect: false,
    });

    if (res?.error) {
      return {
        data: { email },
        errors: {
          _form: ["We couldn't send the magic link. Please try again."],
        },
      };
    }

    return { success: true };
  } catch {
    return {
      errors: { _form: ["Something went wrong. Please try again."] },
    };
  }
}

function SparkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2l1.9 5.9L20 10l-6.1 2.1L12 18l-1.9-5.9L4 10l6.1-2.1L12 2z" />
    </svg>
  );
}

export default function SignInPage() {
  const sp = useSearchParams();
  const callbackUrl = sp?.get("callbackUrl") ?? Router.HOME;

  const [state, formAction, isPending] = React.useActionState<
    ActionState,
    FormData
  >(requestMagicLinkAction, initialActionState);

  // Success side-effect (like closing dialog in your example)
  useEffect(() => {
    if (state?.success) {
      toast.success("Magic link sent", {
        description:
          "Check your inbox and click the link to continue your forecasting journey.",
      });
    }
  }, [state?.success]);

  return (
    <>
      <Toaster theme="dark" richColors closeButton />

      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-slate-900">
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(60%_50%_at_50%_30%,#000_30%,transparent_70%)]">
          <div className="h-full opacity-20 [background:repeating-linear-gradient(180deg,rgba(226,232,240,.08)_0_1px,transparent_1px_32px),repeating-linear-gradient(90deg,rgba(226,232,240,.06)_0_1px,transparent_1px_32px)]" />
        </div>

        <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-2">
          {/* Left: Branding */}
          <div className="space-y-6 text-black">
            <div className="inline-flex items-center gap-3">
              <SparkIcon className="h-6 w-6 fill-black" />
              <span className="text-sm uppercase tracking-widest text-black/80">
                Ŷ Forecasting League
              </span>
            </div>

            <h1 className="text-4xl font-semibold leading-tight md:text-5xl text-black">
              Welcome to the ŷFL
            </h1>

            <p className="text-black/80">
              <span className="font-medium">Powered by Competitive Analytics</span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-black/80">
              <div className="rounded-2xl border border-black/20 bg-white/40 p-4 backdrop-blur">
                <p className="font-semibold text-black">Compete</p>
                <p className="mt-1 text-black/70">Join organizations & weekly challenges.</p>
              </div>
              <div className="rounded-2xl border border-black/20 bg-white/40 p-4 backdrop-blur">
                <p className="font-semibold text-black">Improve</p>
                <p className="mt-1 text-black/70">Track accuracy & build your streak.</p>
              </div>
            </div>
          </div>

          {/* Right: Auth Card */}
          <Card className="border-slate-700 bg-slate-900/90 backdrop-blur text-white">
            <CardHeader className="pb-0">
              <h2 className="text-xl font-semibold text-white">Sign in to continue</h2>
              <p className="text-sm text-white/80">We’ll email you a secure magic link.</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={formAction} className="space-y-4" noValidate>
                {/* Form-level error (matches dialog) */}
                {state?.errors?._form && (
                  <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                    {state.errors._form.join(", ")}
                  </div>
                )}

                {/* Hidden callbackUrl to mirror "bind params" style */}
                <input type="hidden" name="callbackUrl" value={callbackUrl} />

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    disabled={isPending}
                    defaultValue={state?.data?.email ?? ""}
                    aria-describedby={state?.errors?.email ? "email-error" : undefined}
                    className={[
                      "bg-slate-800/80 text-white placeholder:text-white/60 border-slate-700 focus:border-white",
                      state?.errors?.email ? "border-destructive" : "",
                    ].join(" ")}
                  />
                  {state?.errors?.email && (
                    <p id="email-error" className="text-sm text-rose-300">
                      {state.errors.email.join(", ")}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-slate-900 hover:bg-slate-200"
                  disabled={isPending}
                >
                  {isPending ? "Sending…" : "Send magic link"}
                </Button>

                <p className="pt-2 text-center text-xs leading-relaxed text-white/70">
                  By continuing, you agree to the ŷFL’s{" "}
                  <a
                    className="underline underline-offset-4 text-white hover:text-slate-200"
                    href={Router.TERMS ?? "/terms"}
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    className="underline underline-offset-4 text-white hover:text-slate-200"
                    href={Router.PRIVACY ?? "/privacy"}
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
