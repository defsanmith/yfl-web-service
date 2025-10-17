import { Role } from "@/generated/prisma";
import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    organizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
    organizationId: string | null;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: Role;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
  }
}
