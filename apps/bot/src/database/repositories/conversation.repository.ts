import type { ChatRole, Conversation, ConversationMessage } from '@daa/shared';
import {
  ConversationModel,
  type ConversationEntity,
  type ConversationMessageEntity,
} from '../models/conversation.model';

export interface NewConversationMessage {
  role: ChatRole;
  content: string;
  tokens?: number;
}

function toMessage(m: ConversationMessageEntity): ConversationMessage {
  return {
    role: m.role,
    content: m.content,
    tokens: m.tokens,
    createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function toConversation(doc: ConversationEntity): Conversation {
  return {
    userId: doc.userId,
    guildId: doc.guildId ?? null,
    messages: (doc.messages ?? []).map(toMessage),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export class ConversationRepository {
  /** Return the most recent `limit` messages for a (user, guild) context. */
  async getRecentMessages(
    userId: string,
    guildId: string | null,
    limit: number,
  ): Promise<ConversationMessage[]> {
    const doc = await ConversationModel.findOne({ userId, guildId }).lean<ConversationEntity | null>();
    if (!doc) return [];
    return doc.messages.slice(-limit).map(toMessage);
  }

  async get(userId: string, guildId: string | null): Promise<Conversation | null> {
    const doc = await ConversationModel.findOne({ userId, guildId }).lean<ConversationEntity | null>();
    return doc ? toConversation(doc) : null;
  }

  /**
   * Append messages and keep only the most recent `maxMessages` (using a
   * capped `$push` with `$slice`). Creates the conversation on first use.
   */
  async appendMessages(
    userId: string,
    guildId: string | null,
    messages: NewConversationMessage[],
    maxMessages: number,
  ): Promise<void> {
    if (messages.length === 0) return;
    const now = new Date();
    const docs = messages.map((m) => ({ ...m, createdAt: now }));
    await ConversationModel.updateOne(
      { userId, guildId },
      { $push: { messages: { $each: docs, $slice: -Math.abs(maxMessages) } } },
      { upsert: true },
    );
  }

  async reset(userId: string, guildId: string | null): Promise<void> {
    await ConversationModel.updateOne(
      { userId, guildId },
      { $set: { messages: [] } },
      { upsert: true },
    );
  }

  /** Summaries of stored conversations (most recently updated first). */
  async list(
    limit = 200,
  ): Promise<{ userId: string; guildId: string | null; messageCount: number; updatedAt: string }[]> {
    const docs = await ConversationModel.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean<ConversationEntity[]>();
    return docs.map((d) => ({
      userId: d.userId,
      guildId: d.guildId ?? null,
      messageCount: d.messages?.length ?? 0,
      updatedAt: d.updatedAt?.toISOString() ?? new Date().toISOString(),
    }));
  }

  /** The (guild) contexts a user has a conversation in. */
  async listByUser(userId: string): Promise<{ guildId: string | null }[]> {
    const docs = await ConversationModel.find({ userId })
      .select('guildId')
      .lean<ConversationEntity[]>();
    return docs.map((d) => ({ guildId: d.guildId ?? null }));
  }

  /** Permanently remove a conversation document. */
  async delete(userId: string, guildId: string | null): Promise<void> {
    await ConversationModel.deleteOne({ userId, guildId });
  }

  async countConversations(): Promise<number> {
    return ConversationModel.countDocuments().exec();
  }

  async countMessages(): Promise<number> {
    const rows = await ConversationModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: { $size: '$messages' } } } },
    ]);
    return rows[0]?.total ?? 0;
  }
}
