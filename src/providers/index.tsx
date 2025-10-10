"use client";

import { SessionProvider } from "next-auth/react";
import AuthProvider from "./auth";

export default function RootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
