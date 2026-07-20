# syntax=docker/dockerfile:1
# Build context = repository root (see docker-compose.yml).
FROM node:20-slim

RUN corepack enable
WORKDIR /app

# 1) Install dependencies (cached unless a manifest changes).
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/dashboard/package.json ./apps/dashboard/
RUN pnpm install --no-frozen-lockfile --filter @daa/dashboard...

# 2) Copy source and build the Next.js app.
COPY packages/shared ./packages/shared
COPY apps/dashboard ./apps/dashboard

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @daa/dashboard build

WORKDIR /app/apps/dashboard
EXPOSE 3000

CMD ["pnpm", "start"]
