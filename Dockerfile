# syntax=docker/dockerfile:1

FROM node:26-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------- dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts \
 && npm install-scripts approve prisma @prisma/engines esbuild unrs-resolver

# --------------------------------------------------------------------- builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholders only. `prisma generate` reads the config, and `next build`
# validates the environment, but neither connects to anything or bakes these
# in — the real values arrive at runtime from compose.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    SESSION_SECRET="build-time-placeholder-not-used-at-runtime" \
    APP_URL="http://localhost:3000"
RUN npx prisma generate && npm run build

# -------------------------------------------------------------------- migrator
# Runs `prisma migrate deploy` once at startup, then exits.
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts package.json ./
CMD ["npx", "prisma", "migrate", "deploy"]

# ---------------------------------------------------------------------- runner
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Uploads live on a volume mounted here.
RUN mkdir -p /data/uploads && chown -R nextjs:nodejs /data/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
