import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads .env itself, and it moved the connection URL out of
// schema.prisma. Migration and introspection commands read it from here; the
// client gets it through the pg driver adapter in src/server/db.ts.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

// `prisma generate` runs on install, before anyone has written a .env, and it
// never connects to anything. The placeholder keeps that working; a command
// that does connect fails against a host that is obviously not real.
const PLACEHOLDER = "postgresql://unset:unset@database-url-not-set:5432/unset";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? PLACEHOLDER,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
