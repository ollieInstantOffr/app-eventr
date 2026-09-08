import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";
import { env } from "@/lib/env";

// Prisma 7 takes the connection through a driver adapter rather than reading
// it from the schema.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Next's dev server re-evaluates modules on every change; without this we'd
// open a new pool each time.
if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
