"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { toast, Toaster } from "sonner";

function SparkIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path d="M12 2l1.9 5.9L20 10l-6.1 2.1L12 18l-1.9-5.9L4 10l6.1-2.1L12 2z" />
        </svg>
    );
}

const EmailSchema = z.string().email();

export default function SignInPage() {
    const sp = useSearchParams();
    const callbackUrl = sp?.get("callbackUrl") ?? "/";

    const [email, setEmail] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const parsed = EmailSchema.safeParse(email.trim());
        if (!parsed.success) {
            setError("Please enter a valid email.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await signIn("email", {
                email: parsed.data,
                callbackUrl,
                redirect: false,
            });

            if (res?.error) {
                setError("We couldn't send the magic link. Please try again.");
            } else {
                toast.success("Magic link sent", {
                    description:
                        "Check your inbox and click the link to continue your forecasting journey.",
                });
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const isValidEmail = EmailSchema.safeParse(email.trim()).success;

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
                                Financial Forecasting League
                            </span>
                        </div>

                        <h1 className="text-4xl font-semibold leading-tight md:text-5xl text-black">
                            Welcome to the yFL
                        </h1>

                        <p className="text-black/80">
                            <span className="font-medium">Powered by Competitive Analytics</span>
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-black/80">
                            <div className="rounded-2xl border border-black/20 bg-white/40 p-4 backdrop-blur">
                                <p className="font-semibold text-black">Compete</p>
                                <p className="mt-1 text-black/70">
                                    Join organizations & weekly challenges.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-black/20 bg-white/40 p-4 backdrop-blur">
                                <p className="font-semibold text-black">Improve</p>
                                <p className="mt-1 text-black/70">
                                    Track accuracy & build your streak.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Auth Card */}
                    <Card className="border-slate-700 bg-slate-900/90 backdrop-blur text-white">
                        <CardHeader className="pb-0">
                            <h2 className="text-xl font-semibold text-white">Sign in to continue</h2>
                            <p className="text-sm text-white/80">
                                We’ll email you a secure magic link.
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-white">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        placeholder="you@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="bg-slate-800/80 text-white placeholder:text-white/60 border-slate-700 focus:border-white"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-rose-300" role="alert" aria-live="polite">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-white text-slate-900 hover:bg-slate-200"
                                    disabled={!isValidEmail || isLoading}
                                >
                                    {isLoading ? "Sending…" : "Send magic link"}
                                </Button>

                                <p className="pt-2 text-center text-xs leading-relaxed text-white/70">
                                    By continuing, you agree to the yFL’s{" "}
                                    <a
                                        className="underline underline-offset-4 text-white hover:text-slate-200"
                                        href="/terms"
                                    >
                                        Terms
                                    </a>{" "}
                                    and{" "}
                                    <a
                                        className="underline underline-offset-4 text-white hover:text-slate-200"
                                        href="/privacy"
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
