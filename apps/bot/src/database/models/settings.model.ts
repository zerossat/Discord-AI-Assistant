import { Schema, model, type Model, type HydratedDocument } from 'mongoose';
import {
  DEFAULT_AI_MODEL,
  DEFAULT_LANGUAGE,
  DEFAULT_PREFIX,
  DEFAULT_SUMMARY_MESSAGE_LIMIT,
} from '@daa/shared';

export interface SettingsEntity {
  guildId: string;
  aiModel: string;
  prefix: string;
  language: string;
  memoryEnabled: boolean;
  automodEnabled: boolean;
  summaryMessageLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<SettingsEntity>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    aiModel: { type: String, default: DEFAULT_AI_MODEL },
    prefix: { type: String, default: DEFAULT_PREFIX },
    language: { type: String, default: DEFAULT_LANGUAGE },
    memoryEnabled: { type: Boolean, default: true },
    automodEnabled: { type: Boolean, default: false },
    summaryMessageLimit: { type: Number, default: DEFAULT_SUMMARY_MESSAGE_LIMIT },
  },
  { timestamps: true, collection: 'settings' },
);

export type SettingsDocument = HydratedDocument<SettingsEntity>;

export const SettingsModel: Model<SettingsEntity> = model<SettingsEntity>(
  'Settings',
  settingsSchema,
);
