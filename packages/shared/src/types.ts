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

/** AI Gacha Collectible Card. */
export interface GachaCard {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  imageUrl: string;
  atk: number;
  def: number;
  hp: number;
  description: string;
  createdAt: string;
}

/** Funny AI Title assigned to user. */
export interface UserTitle {
  id: string;
  title: string;
  icon: string;
  reason: string;
  awardedAt: string;
}

/** The Turing Project Chameleon Persona. */
export interface TuringPersona {
  name: string;
  avatarUrl?: string;
  personality: string;
  backstory: string;
  slangStyle: string;
}

/** Individual vote in Turing Court. */
export interface TuringVote {
  userId: string;
  username: string;
  choice: 'HUMAN' | 'AI';
  votedAt: string;
}

/** Turing Game status per server. */
export interface TuringGame {
  guildId: string;
  channelId?: string;
  status: 'stealth' | 'court' | 'finished';
  persona: TuringPersona;
  isTargetAi: boolean; // true if suspect is AI Chameleon, false if a real human member!
  targetUserId: string;
  targetUsername: string;
  suspicionCount: number;
  suspectedBy: string[];
  votes: TuringVote[];
  courtExpiresAt?: string;
  updatedAt: string;
}

/** Domain representation of a user (DB-agnostic). */
export interface User {
  discordId: DiscordId;
  username: string;
  preferences: UserPreferences;
  /** Lifetime AI tokens attributed to this user. */
  totalTokens: number;
  /** Experience points gained by user. */
  xp?: number;
  /** Current user level. */
  level?: number;
  /** Inventory of AI Gacha Cards. */
  cards?: GachaCard[];
  /** Awarded funny AI titles. */
  titles?: UserTitle[];
  /** ISO string of last gacha roll time. */
  lastGachaAt?: string;
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
  /** Whether AI Auto-Mod is enabled for toxic message filter. */
  automodEnabled?: boolean;
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
