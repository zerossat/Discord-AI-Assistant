import { Schema, model, type Model, type HydratedDocument } from 'mongoose';
import type { ChatRole } from '@daa/shared';

export interface ConversationMessageEntity {
  role: ChatRole;
  content: string;
  tokens?: number;
  createdAt: Date;
}

export interface ConversationEntity {
  userId: string;
  guildId: string | null;
  messages: ConversationMessageEntity[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<ConversationMessageEntity>(
  {
    role: { type: String, enum: ['user', 'model', 'system'], required: true },
    content: { type: String, required: true },
    tokens: { type: Number },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
);

const conversationSchema = new Schema<ConversationEntity>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, default: null, index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true, collection: 'conversations' },
);

// One conversation document per (user, guild) pair.
conversationSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export type ConversationDocument = HydratedDocument<ConversationEntity>;

export const ConversationModel: Model<ConversationEntity> = model<ConversationEntity>(
  'Conversation',
  conversationSchema,
);
