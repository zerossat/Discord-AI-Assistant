# Architecture

## Overview

The system is a pnpm + Turborepo monorepo with three workspaces:

- **`apps/bot`** — the Discord bot and its HTTP API.
- **`apps/dashboard`** — the Next.js admin dashboard.
- **`packages/shared`** — domain types, constants and Zod helpers shared by both.

`@daa/shared` is an **internal package**: consumers import its TypeScript source directly (the bot via `tsx`, the dashboard via Next `transpilePackages`), so there is no separate build step for local development.

## Bot layers (Clean Architecture)

```
Discord / HTTP  →  Commands & Routes  →  Services  →  Repositories  →  MongoDB / Redis
   (adapters)         (interface)        (use cases)   (data access)      (infra)
                                  │
                                  └── AI (GeminiService) — external provider
```

- **Commands / Events / Routes (interface layer).** Translate Discord interactions and HTTP requests into service calls. They never touch Mongoose directly.
- **Services (application layer).** `ChatService`, `MemoryService`, `StatsService`, `CacheService` orchestrate use cases. Dependencies are injected via constructors (see `services/index.ts`, the composition root), which keeps them unit-testable.
- **Repositories (data-access layer).** `UserRepository`, `ConversationRepository`, `SettingsRepository` wrap Mongoose models and return **domain types** from `@daa/shared`, not raw documents (Repository Pattern).
- **AI.** `GeminiService` wraps `@google/genai`, rotating across API keys and falling back through a chain of models on rate limits, and normalising token usage so the rest of the app is provider-agnostic.

### Dependency injection

`createServiceContainer()` instantiates Redis, repositories and services once and passes the container to commands, events and routes. Tests construct services directly with fakes — no globals, no module-level side effects in the inner layers (the validated `env` is only imported at the composition root).

## Memory system

Per `(userId, guildId)`:

1. `MemoryService.getContext()` checks **Redis** first (`memory:<guild|dm>:<user>`).
2. On a miss it reads the recent window from **MongoDB** and warms the cache.
3. `MemoryService.record()` appends new turns (capped via a `$push` + `$slice` to `MEMORY_MAX_MESSAGES`) and invalidates the cache.

This gives fast context reads while MongoDB remains the source of truth.

## Data model

**users**
```ts
{ discordId: string (unique), username: string,
  preferences: { language, defaultTranslateTo, memoryEnabled },
  totalTokens: number, createdAt, updatedAt }
```

**conversations**
```ts
{ userId: string, guildId: string | null,
  messages: [{ role: 'user'|'model'|'system', content, tokens?, createdAt }],
  createdAt, updatedAt }            // unique index on (userId, guildId)
```

**settings**
```ts
{ guildId: string (unique), aiModel, prefix, language,
  memoryEnabled, summaryMessageLimit, createdAt, updatedAt }
```

## Dashboard ↔ Bot

The dashboard renders **server-side** and calls the bot's Express API. It mints a short-lived HS256 JWT signed with the shared `JWT_SECRET`; the bot verifies it with `requireAuth`. No separate auth service is needed between the two apps.

## Configuration

Every process validates its environment with **Zod** at startup (`apps/bot/src/config/env.ts`). Invalid/missing variables fail fast with a readable error via the shared `parseEnv()` helper.
