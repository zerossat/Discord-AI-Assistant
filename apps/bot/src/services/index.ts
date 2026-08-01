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
import { AutoModService } from './automod.service';
import { ImageService } from './image.service';
import { HackBotService } from './hackbot.service';
import { GuessPromptService } from './guessprompt.service';
import { GachaService } from './gacha.service';
import { TitlesService } from './titles.service';
import { TuringService } from './turing.service';
import { GameRepository, TuringRepository } from '../database/repositories';

export { CacheService } from './cache.service';
export { MemoryService, type MemoryServiceOptions } from './memory.service';
export { ChatService, type ChatContext } from './chat.service';
export { StatsService } from './stats.service';
export { TtsService } from './tts.service';
export { MusicService } from './music.service';
export { AutoModService, type AutoModResult } from './automod.service';
export {
  ImageService,
  type ImageGenerationOptions,
  type ImageGenerationResult,
} from './image.service';
export { HackBotService, type HackBotAttemptResult } from './hackbot.service';
export { GuessPromptService, type GuessPromptResult } from './guessprompt.service';
export { GachaService } from './gacha.service';
export { TitlesService } from './titles.service';
export { TuringService } from './turing.service';

export interface Repositories {
  users: UserRepository;
  conversations: ConversationRepository;
  settings: SettingsRepository;
  games: GameRepository;
  turing: TuringRepository;
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
  automod: AutoModService;
  image: ImageService;
  hackbot: HackBotService;
  guessprompt: GuessPromptService;
  gacha: GachaService;
  titles: TitlesService;
  turing: TuringService;
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
    games: new GameRepository(),
    turing: new TuringRepository(),
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
  const automod = new AutoModService(gemini);
  const image = new ImageService(gemini);
  const hackbot = new HackBotService(gemini, repositories.games);
  const guessprompt = new GuessPromptService(image, repositories.games);
  const gacha = new GachaService(image, repositories.users);
  const titles = new TitlesService(gemini, repositories.users);
  const turing = new TuringService(gemini, repositories.turing, repositories.users);

  return {
    redis,
    cache,
    gemini,
    repositories,
    memory,
    chat,
    stats,
    tts,
    music,
    automod,
    image,
    hackbot,
    guessprompt,
    gacha,
    titles,
    turing,
  };
}
