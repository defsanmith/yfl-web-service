import { z } from "zod";

// Define the environment variable schema
const envSchema = z.object({
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.url("NEXTAUTH_URL must be a valid URL"),

  // Admin
  ADMIN_EMAIL: z.email("ADMIN_EMAIL must be a valid email").optional(),

  // Email Server
  EMAIL_SERVER_HOST: z.string().min(1, "EMAIL_SERVER_HOST is required"),
  EMAIL_SERVER_PORT: z
    .string()
    .regex(/^\d+$/, "EMAIL_SERVER_PORT must be a number"),
  EMAIL_SERVER_USER: z.string().min(1, "EMAIL_SERVER_USER is required"),
  EMAIL_SERVER_PASSWORD: z.string().min(1, "EMAIL_SERVER_PASSWORD is required"),
  EMAIL_FROM: z.string("EMAIL_FROM must be a valid string"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(z.treeifyError(result.error));
    throw new Error("Invalid environment variables");
  }

  return result.data;
};

// Parse and validate environment variables
const env = parseEnv();

class Config {
  nextAuth = {
    adminEmail: env.ADMIN_EMAIL,
    email: {
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: Number(env.EMAIL_SERVER_PORT),
        user: env.EMAIL_SERVER_USER,
        pass: env.EMAIL_SERVER_PASSWORD,
      },
      from: env.EMAIL_FROM,
    },
  };

  database = {
    url: env.DATABASE_URL,
  };

  nodeEnv = env.NODE_ENV;
}

const config = new Config();

export default config;
