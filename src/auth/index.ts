import config from "@/constants/config";
import { Role } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import NextAuth, { AuthOptions, getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";

const authConfig: AuthOptions = {
  // @ts-expect-error - Type mismatch between @auth/core versions in dependencies
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/signin",
  },
  // Use JWT strategy for better performance (no DB query on every session access)
  session: {
    strategy: "jwt",
  },
  providers: [
    EmailProvider({
      server: {
        host: config.nextAuth.email.server.host,
        port: config.nextAuth.email.server.port,
        auth: {
          user: config.nextAuth.email.server.user,
          pass: config.nextAuth.email.server.pass,
        },
      },
      from: config.nextAuth.email.from,
    }),
  ],
  callbacks: {
    // JWT callback: runs when JWT is created or updated
    // This is where we add custom data to the token
    async jwt({ token, user, trigger }) {
      // Initial sign in - user object is available
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }

      // Handle token refresh or update
      // Optionally refresh role and organizationId from DB on token update
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, organizationId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
        }
      }

      return token;
    },

    // Session callback: runs when session is checked
    // This is where we add data from token to session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
  },
};

export const handlers = NextAuth(authConfig);

// Use it in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authConfig);
}
