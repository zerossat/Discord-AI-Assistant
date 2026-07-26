import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';
import { parseEnv, portString } from '@daa/shared';

// Load env from the package dir first, then fill any gaps from the monorepo
// root .env (used by docker-compose and single-file local setups).
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

/**
 * Bot environment schema. Validated once at startup; importing this module
 * anywhere guarantees a fully-typed, validated `env` object with fallbacks.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // Discord
  DISCORD_TOKEN: z.string().default(process.env.DISCORD_TOKEN || ''),
  DISCORD_CLIENT_ID: z.string().default(process.env.DISCORD_CLIENT_ID || '1519353070553923715'),
  DISCORD_DEV_GUILD_ID: z.string().optional().default(''),

  // Gemini — provide a single key (GEMINI_API_KEY) and/or a comma-separated
  // list (GEMINI_API_KEYS).
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEYS: z.string().optional().default(''),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  // Models tried (in order) when the primary model is exhausted/unavailable.
  GEMINI_FALLBACK_MODELS: z
    .string()
    .optional()
    .default('gemini-2.5-flash-lite,gemini-2.0-flash,gemini-1.5-flash'),

  // Data stores
  MONGODB_URI: z.string().default(process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-bot'),
  REDIS_URL: z.string().default(process.env.REDIS_URL || 'redis://localhost:6379'),

  // HTTP API
  API_PORT: portString.default(
    process.env.PORT
      ? Number(process.env.PORT)
      : process.env.API_PORT
      ? Number(process.env.API_PORT)
      : 4000,
  ),
  JWT_SECRET: z.string().default(process.env.JWT_SECRET || 'discord_ai_assistant_fallback_secret_32bytes'),

  // Memory
  MEMORY_MAX_MESSAGES: z.coerce.number().int().min(1).max(100).default(20),
  MEMORY_CACHE_TTL: z.coerce.number().int().min(0).default(3600),
});

export type BotEnv = z.infer<typeof envSchema>;

export const env: BotEnv = parseEnv(envSchema);

/** Split a comma/whitespace-separated env value into trimmed, non-empty entries. */
function splitList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Every configured Gemini API key, de-duplicated and order-preserving.
 * Merges GEMINI_API_KEYS (list) with GEMINI_API_KEY (single) so either works.
 */
export const GEMINI_API_KEYS: string[] = Array.from(
  new Set(splitList([env.GEMINI_API_KEYS, env.GEMINI_API_KEY].join(','))),
);

if (GEMINI_API_KEYS.length === 0) {
  GEMINI_API_KEYS.push('dummy_gemini_key_fallback');
}

/** Ordered fallback models used when the primary model is exhausted/unavailable. */
export const GEMINI_FALLBACK_MODELS: string[] = splitList(env.GEMINI_FALLBACK_MODELS).filter(
  (model) => model !== env.GEMINI_MODEL,
);

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
