import { z } from "zod";

/**
 * Environment is validated once, at first import, so a missing SESSION_SECRET
 * fails the container at boot rather than at the first sign-in attempt.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Eventr <no-reply@instantoffr.com>"),
  UPLOADS_DIR: z.string().default("./uploads"),
  SMS_PROVIDER: z.string().optional().default(""),
  SMS_API_KEY: z.string().optional().default(""),
  SMS_FROM: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

/** Email is only actually delivered when a Resend key is configured. */
export const emailDeliveryEnabled = env.RESEND_API_KEY.length > 0;
