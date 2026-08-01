import { Schema, model, type Model, type HydratedDocument } from 'mongoose';

export interface TuringPersonaEntity {
  name: string;
  avatarUrl?: string;
  personality: string;
  backstory: string;
  slangStyle: string;
}

export interface TuringVoteEntity {
  userId: string;
  username: string;
  choice: 'HUMAN' | 'AI';
  votedAt: Date;
}

export interface TuringEntity {
  guildId: string;
  channelId?: string;
  status: 'stealth' | 'court' | 'finished';
  persona: TuringPersonaEntity;
  isTargetAi: boolean;
  targetUserId: string;
  targetUsername: string;
  suspicionCount: number;
  suspectedBy: string[];
  votes: TuringVoteEntity[];
  courtExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const personaSchema = new Schema<TuringPersonaEntity>(
  {
    name: { type: String, required: true },
    avatarUrl: { type: String },
    personality: { type: String, required: true },
    backstory: { type: String, required: true },
    slangStyle: { type: String, required: true },
  },
  { _id: false },
);

const voteSchema = new Schema<TuringVoteEntity>(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    choice: { type: String, enum: ['HUMAN', 'AI'], required: true },
    votedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const turingSchema = new Schema<TuringEntity>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String },
    status: { type: String, enum: ['stealth', 'court', 'finished'], default: 'stealth' },
    persona: { type: personaSchema, required: true },
    isTargetAi: { type: Boolean, default: true },
    targetUserId: { type: String, required: true },
    targetUsername: { type: String, required: true },
    suspicionCount: { type: Number, default: 0 },
    suspectedBy: { type: [String], default: [] },
    votes: { type: [voteSchema], default: [] },
    courtExpiresAt: { type: Date },
  },
  { timestamps: true, collection: 'turing_games' },
);

export type TuringDocument = HydratedDocument<TuringEntity>;

export const TuringModel: Model<TuringEntity> = model<TuringEntity>('TuringGame', turingSchema);
