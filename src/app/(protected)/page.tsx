// src/app/(protected)/page.tsx
import { redirect } from "next/navigation";

export default function ProtectedRootPage() {
  redirect("/dashboard");
}
