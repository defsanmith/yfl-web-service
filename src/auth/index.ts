import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import EmailProvider from "next-auth/providers/email";
import config from "@/constants/config";

export const handlers = NextAuth({
  adapter: PrismaAdapter(prisma),
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
});
