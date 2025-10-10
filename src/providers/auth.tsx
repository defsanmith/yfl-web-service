import { useSession } from "next-auth/react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession({
    required: true,
  });

  if (session.status === "loading") {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
