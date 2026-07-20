# Discord AI Assistant

A modern, full-stack **Discord AI Assistant** built with TypeScript: a Discord.js v14 bot powered by the **Google Gemini API**, plus a **Next.js 15** admin dashboard. Monorepo managed with **pnpm + Turborepo**.

> Chat with AI · conversation memory · coding help · message summaries · translation · basic server management · admin dashboard.

---

## ✨ Features

| Command | Description |
| --- | --- |
| `/ask <question>` | Context-aware chat with Gemini (uses conversation memory). |
| `/code <prompt>` | Generates code with an explanation and best practices. |
| `/summary [limit]` | Summarises the last N messages in the channel (≤100). |
| `/translate <to> <text> [from]` | Translates text between languages. |
| `/config view\|set` | View/update per-guild settings (admin — `Manage Server`). |
| `/stats` | Bot-wide usage statistics. |
| `/reset-memory` | Clears your conversation memory in the current context. |
| `/tarot [so-la] [cau-hoi]` | Draws 1 or 3 tarot cards and gives an AI reading (with built-in card meanings). |
| `/ship <nguoi-ay> [nguoi-thu-2]` | Fun compatibility % between two people (stable per pair, offline). |
| `/tts <noi-dung> [giong]` | Speaks text in your voice channel (Google or Gemini voice); stays until the channel empties. |
| `/leave` | Makes the bot leave the voice channel. |
| `/help` | Lists every command grouped by category. |
| `/menu` | Interactive command menu (pick a category from a dropdown). |

- **Memory system** — a Redis-cached, MongoDB-backed sliding window of recent messages per `(user, guild)`.
- **Dashboard** — Discord OAuth2 login (NextAuth), usage stats, total AI tokens, server list.
- **HTTP API** — Express + **Swagger** docs at `/api/docs`.

## 🧱 Tech stack

- **Bot:** Node.js, TypeScript, Discord.js v14, Express, Mongoose (MongoDB), ioredis (Redis), `@google/genai`, Zod, Pino, Swagger.
- **Dashboard:** Next.js 15 (App Router), TailwindCSS, shadcn-style UI, NextAuth (Discord).
- **Shared:** `@daa/shared` package with domain types, constants and Zod helpers.
- **Tooling:** pnpm workspaces, Turborepo, ESLint, Prettier, Vitest, Docker, GitHub Actions.

## 📁 Monorepo layout

```
discord-ai-assistant/
├── apps/
│   ├── bot/                 # Discord bot + Express API (Swagger)
│   │   └── src/
│   │       ├── ai/          # Gemini service + prompt builders
│   │       ├── commands/    # Slash commands
│   │       ├── config/      # Zod-validated env
│   │       ├── database/    # Mongoose models + repositories + seed
│   │       ├── discord/     # Gateway client
│   │       ├── events/      # ready / interactionCreate
│   │       ├── server/      # Express app, routes, Swagger, auth
│   │       ├── services/    # chat / memory / stats / cache (+ DI container)
│   │       ├── utils/       # logger, reply helpers
│   │       └── index.ts     # bootstrap
│   └── dashboard/           # Next.js 15 admin dashboard
│       ├── app/             # routes (App Router)
│       ├── components/      # UI components
│       └── lib/             # auth, bot-API client, utils
├── packages/
│   └── shared/              # @daa/shared — types, constants, zod helpers
├── docker/                  # mongo init script
├── docs/                    # architecture & API docs
├── .github/workflows/       # CI
├── docker-compose.yml
└── .env.example
```

## ✅ Prerequisites

- **Node.js ≥ 20** and **pnpm 9** (`corepack enable` then `corepack prepare pnpm@9 --activate`).
- A **Discord application + bot** — https://discord.com/developers/applications
  - Copy the **bot token**, **client ID**, and OAuth2 **client secret**.
  - Under **Bot → Privileged Gateway Intents**, enable **Message Content Intent** (required by `/summary`).
  - Add an OAuth2 redirect URL: `http://localhost:3000/api/auth/callback/discord`.
- A **Gemini API key** — https://ai.google.dev
- For local (non-Docker) runs: a **MongoDB** and **Redis** instance (or just use Docker for those).

## 🚀 Quick start (Docker)

```bash
# 1. Configure env
cp .env.example .env
#    → fill in DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET,
#      GEMINI_API_KEY, JWT_SECRET, NEXTAUTH_SECRET (use long random strings)

# 2. Start everything (MongoDB, Redis, bot, dashboard)
docker compose up -d

# 3. Seed demo data (optional)
docker compose exec bot pnpm seed

# 4. Register slash commands with Discord
docker compose exec bot pnpm deploy:commands
```

- Dashboard → http://localhost:3000
- Bot API + Swagger → http://localhost:4000/api/docs

> Tip: set `DISCORD_DEV_GUILD_ID` in `.env` to register commands instantly to one server while developing (global commands can take up to ~1h to appear).

## 🛠️ Local development (without Docker for the apps)

```bash
pnpm install

# Bring up just the datastores via Docker (or point env at your own):
docker compose up -d mongo redis

# Register slash commands once:
pnpm bot:deploy-commands

# Run bot + dashboard together (Turborepo):
pnpm dev
# …or individually:
pnpm bot:dev
pnpm dashboard:dev
```

The bot and dashboard both auto-load the **root `.env`**, so a single file works for the whole monorepo.

## 🔐 Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `DISCORD_TOKEN` | bot | Bot token. |
| `DISCORD_CLIENT_ID` | bot | Application (client) ID — used to register commands. |
| `DISCORD_CLIENT_SECRET` | dashboard | OAuth2 client secret. |
| `DISCORD_DEV_GUILD_ID` | bot | Optional: register commands to one guild instantly. |
| `GEMINI_API_KEY` / `GEMINI_API_KEYS` | bot | One key, or a comma-separated list rotated on rate limits (429). |
| `GEMINI_MODEL` | bot | Default model (e.g. `gemini-2.5-flash`). |
| `GEMINI_FALLBACK_MODELS` | bot | Comma-separated models tried when the primary is throttled/unavailable. |
| `MONGODB_URI` | bot | MongoDB connection string. |
| `REDIS_URL` | bot | Redis connection string. |
| `JWT_SECRET` | bot + dashboard | Shared secret; dashboard mints JWTs the bot API verifies. |
| `ADMIN_IDS` | dashboard | Comma-separated Discord IDs allowed to edit/delete. Empty = anyone logged in. |
| `API_PORT` | bot | Express API port (default `4000`). |
| `MEMORY_MAX_MESSAGES` | bot | Messages kept per conversation (default `20`). |
| `MEMORY_CACHE_TTL` | bot | Redis TTL for cached context, seconds (default `3600`). |
| `NEXTAUTH_URL` | dashboard | Public dashboard URL. |
| `NEXTAUTH_SECRET` | dashboard | NextAuth session secret. |
| `BOT_API_URL` | dashboard | Server-side URL of the bot API. |
| `NEXT_PUBLIC_APP_NAME` | dashboard | Display name. |

## 📊 Dashboard

1. Open http://localhost:3000 and **sign in with Discord**.
2. View users, conversations, servers, messages and total AI tokens.
3. Browse the servers the bot is in (with their current model/prefix/memory settings).

The dashboard fetches data **server-side** from the bot API, authenticating with a short-lived JWT signed using the shared `JWT_SECRET`.

## 📚 API & Swagger

- Swagger UI: `GET /api/docs`
- OpenAPI JSON: `GET /api/docs.json`

| Endpoint | Auth | Description |
| --- | --- | --- |
| `GET /api/health` | public | Mongo/Redis/Discord status. |
| `GET /api/stats` | Bearer JWT | Aggregate usage stats. |
| `GET /api/guilds` | Bearer JWT | Guilds + settings. |
| `PATCH /api/guilds/:guildId` | Bearer JWT | Update a guild's settings. |

See [`docs/API.md`](docs/API.md) for details (including how to mint a test token).

## 🗄️ Database

Collections: `users`, `conversations`, `settings` (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)).

```bash
pnpm seed   # inserts demo users, a guild settings doc and a sample conversation
```

## 🧪 Scripts

```bash
pnpm dev          # run all apps (turbo)
pnpm build        # build all packages
pnpm lint         # eslint across the monorepo
pnpm typecheck    # tsc --noEmit across packages
pnpm test         # vitest unit tests
pnpm format       # prettier --write
pnpm seed         # seed the database
pnpm bot:deploy-commands  # register slash commands
```

## 🤖 CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs **lint → typecheck → test → build** on every push/PR to `main`.

## 🩹 Troubleshooting

- **Slash commands don't show up** — run `pnpm bot:deploy-commands`; set `DISCORD_DEV_GUILD_ID` for instant registration.
- **`/summary` returns nothing** — enable the **Message Content Intent** in the Developer Portal.
- **Dashboard shows "Không lấy được dữ liệu từ Bot API"** — ensure the bot is running and `BOT_API_URL` + `JWT_SECRET` match.
- **Frozen-lockfile errors in Docker** — commit a `pnpm-lock.yaml` (`pnpm install` once locally), or keep the provided `--no-frozen-lockfile`.

## 📄 License

MIT — see project for details.
#   D i s c o r d - A I - A s s i s t a n t  
 