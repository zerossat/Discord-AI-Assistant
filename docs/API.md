# Bot HTTP API

The bot exposes a small Express API consumed by the dashboard. Interactive docs are served by Swagger UI.

- **Swagger UI:** `http://localhost:4000/api/docs`
- **OpenAPI JSON:** `http://localhost:4000/api/docs.json`

## Authentication

Protected endpoints expect a **Bearer JWT** signed (HS256) with the shared `JWT_SECRET`. The dashboard mints these automatically. To create one manually for testing:

```bash
node -e "console.log(require('jsonwebtoken').sign({sub:'test',role:'admin'}, process.env.JWT_SECRET, {expiresIn:'5m'}))"
```

Then:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/stats
```

## Endpoints

### `GET /api/health` — public

```json
{ "status": "ok", "uptime": 123.4, "mongo": true, "redis": true, "discord": true }
```

### `GET /api/stats` — Bearer

```json
{
  "totalUsers": 42,
  "totalConversations": 88,
  "totalGuilds": 5,
  "totalMessages": 1024,
  "totalTokens": 350000,
  "generatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /api/guilds` — Bearer

```json
{
  "guilds": [
    {
      "guildId": "900000000000000001",
      "name": "My Server",
      "memberCount": 120,
      "aiModel": "gemini-2.5-flash",
      "prefix": "!",
      "memoryEnabled": true
    }
  ]
}
```

### `PATCH /api/guilds/{guildId}` — Bearer

Request body (all fields optional):

```json
{
  "aiModel": "gemini-2.5-pro",
  "prefix": "!",
  "language": "vi",
  "memoryEnabled": true,
  "summaryMessageLimit": 100
}
```

Returns the updated guild settings. Invalid bodies return `400` with Zod `issues`.
