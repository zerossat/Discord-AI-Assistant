import { Schema, model, type Model, type HydratedDocument } from 'mongoose';
import { DEFAULT_LANGUAGE } from '@daa/shared';

export interface UserPreferencesEntity {
  language: string;
  defaultTranslateTo: string;
  memoryEnabled: boolean;
}

export interface UserEntity {
  discordId: string;
  username: string;
  preferences: UserPreferencesEntity;
  totalTokens: number;
  xp: number;
  level: number;
  lastXpAt?: Date;
  cards?: any[];
  titles?: any[];
  lastGachaAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const preferencesSchema = new Schema<UserPreferencesEntity>(
  {
    language: { type: String, default: DEFAULT_LANGUAGE },
    defaultTranslateTo: { type: String, default: 'en' },
    memoryEnabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new Schema<UserEntity>(
  {
    discordId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    preferences: { type: preferencesSchema, default: () => ({}) },
    totalTokens: { type: Number, default: 0 },
    xp: { type: Number, default: 0, index: true },
    level: { type: Number, default: 1 },
    lastXpAt: { type: Date },
    cards: { type: [Schema.Types.Mixed], default: [] },
    titles: { type: [Schema.Types.Mixed], default: [] },
    lastGachaAt: { type: Date },
  },
  { timestamps: true, collection: 'users' },
);

export type UserDocument = HydratedDocument<UserEntity>;

export const UserModel: Model<UserEntity> = model<UserEntity>('User', userSchema);
