# syntax=docker/dockerfile:1
# Build context = repository root (see docker-compose.yml).
FROM node:20-slim

RUN corepack enable
WORKDIR /app

# 1) Install dependencies (cached unless a manifest changes).
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/bot/package.json ./apps/bot/
RUN pnpm install --no-frozen-lockfile --filter @daa/bot...

# 2) Copy source (shared is consumed as TypeScript source; the bot runs via tsx).
COPY packages/shared ./packages/shared
COPY apps/bot ./apps/bot

ENV NODE_ENV=production
WORKDIR /app/apps/bot
EXPOSE 4000

CMD ["pnpm", "start"]
