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
  // Where email previews are written when RESEND_API_KEY is empty — a dev
  // convenience, unrelated to uploaded files (those live in S3 below).
  UPLOADS_DIR: z.string().default("./uploads"),
  // S3-compatible object storage for uploaded logos and generated posters.
  // Works against AWS S3 or any S3-compatible provider (MinIO, Cloudflare
  // R2, DigitalOcean Spaces, Backblaze B2, ...) by pointing S3_ENDPOINT at
  // that provider. S3_REGION defaults to "auto", which R2 and most
  // self-hosted providers accept; on real AWS S3 set it to your bucket's
  // actual region (e.g. "eu-west-1") or request signing will fail.
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required"),
  S3_ENDPOINT: z
    .string()
    .url("S3_ENDPOINT must be a URL, e.g. https://s3.eu-west-1.amazonaws.com"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_REGION: z.string().min(1).default("auto"),
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
