import type { ConversationMessage } from '@daa/shared';
import type {
  ConversationRepository,
  NewConversationMessage,
} from '../database/repositories';
import type { CacheService } from './cache.service';
import type { Logger } from '../utils/logger';

export interface MemoryServiceOptions {
  maxMessages: number;
  cacheTtlSeconds: number;
}

/**
 * Conversation memory: a Redis-cached, MongoDB-backed sliding window of the
 * most recent messages per (user, guild) context.
 */
export class MemoryService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly cache: CacheService,
    private readonly options: MemoryServiceOptions,
    private readonly logger?: Logger,
  ) {}

  private key(userId: string, guildId: string | null): string {
    return `memory:${guildId ?? 'dm'}:${userId}`;
  }

  /** Recent context, served from cache when warm, otherwise from Mongo. */
  async getContext(userId: string, guildId: string | null): Promise<ConversationMessage[]> {
    const cacheKey = this.key(userId, guildId);
    const cached = await this.cache.getJSON<ConversationMessage[]>(cacheKey);
    if (cached) return cached;

    const messages = await this.conversations.getRecentMessages(
      userId,
      guildId,
      this.options.maxMessages,
    );
    if (messages.length > 0) {
      await this.cache.setJSON(cacheKey, messages, this.options.cacheTtlSeconds);
    }
    return messages;
  }

  /** Persist new turns and invalidate the cached window. */
  async record(
    userId: string,
    guildId: string | null,
    turns: NewConversationMessage[],
  ): Promise<void> {
    await this.conversations.appendMessages(userId, guildId, turns, this.options.maxMessages);
    await this.cache.del(this.key(userId, guildId));
  }

  async reset(userId: string, guildId: string | null): Promise<void> {
    await this.conversations.reset(userId, guildId);
    await this.cache.del(this.key(userId, guildId));
  }

  /** Delete the conversation entirely and drop its cached window. */
  async forget(userId: string, guildId: string | null): Promise<void> {
    await this.conversations.delete(userId, guildId);
    await this.cache.del(this.key(userId, guildId));
  }
}
