/** A Discord snowflake id (user, guild, channel, …). */
export type DiscordId = string;

/**
 * Roles understood by the Gemini chat API. We normalise everything to these
 * three values across the codebase ("assistant" → "model").
 */
export type ChatRole = 'user' | 'model' | 'system';

/** A single turn in a stored conversation. */
export interface ConversationMessage {
  role: ChatRole;
  content: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
  /** Approximate token count for this message, if known. */
  tokens?: number;
}

/** Per-user preferences. */
export interface UserPreferences {
  /** Preferred language for AI responses, e.g. "vi" or "en". */
  language: string;
  /** Default target language for `/translate` when omitted. */
  defaultTranslateTo: string;
  /** Whether the bot should remember this user's conversations. */
  memoryEnabled: boolean;
}

/** Domain representation of a user (DB-agnostic). */
export interface User {
  discordId: DiscordId;
  username: string;
  preferences: UserPreferences;
  /** Lifetime AI tokens attributed to this user. */
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

/** Domain representation of a stored conversation. */
export interface Conversation {
  userId: DiscordId;
  /** `null` for DMs / non-guild contexts. */
  guildId: DiscordId | null;
  messages: ConversationMessage[];
  updatedAt: string;
}

/** Per-guild bot configuration. */
export interface GuildSettings {
  guildId: DiscordId;
  aiModel: string;
  prefix: string;
  language: string;
  memoryEnabled: boolean;
  /** How many messages `/summary` should fetch. */
  summaryMessageLimit: number;
  updatedAt: string;
}

/** Result returned by the AI service for a single generation. */
export interface AiGenerationResult {
  text: string;
  model: string;
  /** Best-effort token usage; providers don't always report this. */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
