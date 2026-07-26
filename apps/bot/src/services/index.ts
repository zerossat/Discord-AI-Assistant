import { Redis } from 'ioredis';
import { env, GEMINI_API_KEYS, GEMINI_FALLBACK_MODELS } from '../config/env';
import { logger } from '../utils/logger';
import { GeminiService } from '../ai/gemini.service';
import {
  ConversationRepository,
  SettingsRepository,
  UserRepository,
} from '../database/repositories';
import { CacheService } from './cache.service';
import { MemoryService } from './memory.service';
import { ChatService } from './chat.service';
import { StatsService } from './stats.service';
import { TtsService } from './tts.service';
import { MusicService } from './music.service';

export { CacheService } from './cache.service';
export { MemoryService, type MemoryServiceOptions } from './memory.service';
export { ChatService, type ChatContext } from './chat.service';
export { StatsService } from './stats.service';
export { TtsService } from './tts.service';
export { MusicService } from './music.service';

export interface Repositories {
  users: UserRepository;
  conversations: ConversationRepository;
  settings: SettingsRepository;
}

export interface ServiceContainer {
  redis: Redis;
  cache: CacheService;
  gemini: GeminiService;
  repositories: Repositories;
  memory: MemoryService;
  chat: ChatService;
  stats: StatsService;
  tts: TtsService;
  music: MusicService;
}

/**
 * Composition root. Instantiates every singleton and wires dependencies.
 * Created once in `index.ts` and passed down to commands / events / routes.
 */
export function createServiceContainer(): ServiceContainer {
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  redis.on('error', (err) => logger.error({ err }, '[redis] error'));
  redis.on('connect', () => logger.info('[redis] connected'));

  const cache = new CacheService(redis, logger);
  const gemini = new GeminiService({
    apiKeys: GEMINI_API_KEYS,
    defaultModel: env.GEMINI_MODEL,
    fallbackModels: GEMINI_FALLBACK_MODELS,
    logger,
  });

  const repositories: Repositories = {
    users: new UserRepository(),
    conversations: new ConversationRepository(),
    settings: new SettingsRepository(),
  };

  const memory = new MemoryService(
    repositories.conversations,
    cache,
    { maxMessages: env.MEMORY_MAX_MESSAGES, cacheTtlSeconds: env.MEMORY_CACHE_TTL },
    logger,
  );
  const chat = new ChatService(gemini, memory, repositories.users, logger);
  const stats = new StatsService(
    repositories.users,
    repositories.conversations,
    repositories.settings,
  );
  const tts = new TtsService({ apiKeys: GEMINI_API_KEYS, logger });
  const music = new MusicService(logger);

  return { redis, cache, gemini, repositories, memory, chat, stats, tts, music };
}
