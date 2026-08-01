export const DEFAULT_AI_MODEL = 'gemini-2.5-flash';
export const DEFAULT_PREFIX = '!';
export const DEFAULT_LANGUAGE = 'vi';
export const DEFAULT_MEMORY_MAX_MESSAGES = 20;
export const DEFAULT_SUMMARY_MESSAGE_LIMIT = 100;
export const DEFAULT_MEMORY_CACHE_TTL = 3600;

/**
 * Models we expose in `/config` and the dashboard dropdown.
 * Supports Gemini 3.6, 3.5, 3.1, 2.5, 2.0, and 1.5.
 */
export const SUPPORTED_AI_MODELS = [
  'gemini-3.6-pro',
  'gemini-3.6-flash',
  'gemini-3.5-pro',
  'gemini-3.5-flash',
  'gemini-3.1-pro',
  'gemini-3.1-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
] as const;

export type SupportedAiModel = (typeof SUPPORTED_AI_MODELS)[number];

/** Canonical slash-command names (single source of truth). */
export const COMMAND_NAMES = {
  ASK: 'ask',
  CODE: 'code',
  SUMMARY: 'summary',
  TRANSLATE: 'translate',
  CONFIG: 'config',
  STATS: 'stats',
  RESET_MEMORY: 'reset-memory',
  CLEAR: 'clear',
  TAROT: 'tarot',
  SHIP: 'ship',
  TTS: 'tts',
  LEAVE: 'leave',
  HELP: 'help',
  MENU: 'menu',
  PLAY: 'play',
  SKIP: 'skip',
  STOP: 'stop',
  PAUSE: 'pause',
  RESUME: 'resume',
  QUEUE: 'queue',
  QUIZ: 'quiz',
  IMAGINE: 'imagine',
  RANK: 'rank',
  LEADERBOARD: 'leaderboard',
  TOP: 'top',
  HACKBOT: 'hackbot',
  GUESSPROMPT: 'guessprompt',
  GUESS: 'guess',
  GACHA: 'gacha',
  CARDS: 'cards',
  TITLES: 'titles',
  TURING: 'turing',
  GUIDE: 'guide',
} as const;

export type CommandName = (typeof COMMAND_NAMES)[keyof typeof COMMAND_NAMES];

/** Discord hard limit for a single message. We chunk anything longer. */
export const DISCORD_MESSAGE_LIMIT = 2000;

/** A small, friendly subset of language codes used by `/translate`. */
export const COMMON_LANGUAGES: Record<string, string> = {
  vi: 'Vietnamese',
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
};
