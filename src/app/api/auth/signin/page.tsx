"use client";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") as string;
    await signIn("email", { email, callbackUrl: "/" });
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4 text-center">Sign in</h1>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full border rounded px-3 py-2 mb-4"
        />
        <button type="submit" className="w-full rounded py-2 bg-blue-600 text-white hover:bg-blue-700">
          Send magic link
        </button>
      </form>
    </main>
  );
}
