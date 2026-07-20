import {
  DEFAULT_AI_MODEL,
  DEFAULT_LANGUAGE,
  DEFAULT_PREFIX,
  DEFAULT_SUMMARY_MESSAGE_LIMIT,
  type GuildSettings,
} from '@daa/shared';
import { SettingsModel, type SettingsEntity } from '../models/settings.model';

export type GuildSettingsPatch = Partial<
  Pick<
    GuildSettings,
    'aiModel' | 'prefix' | 'language' | 'memoryEnabled' | 'summaryMessageLimit'
  >
>;

function toSettings(doc: SettingsEntity): GuildSettings {
  return {
    guildId: doc.guildId,
    aiModel: doc.aiModel ?? DEFAULT_AI_MODEL,
    prefix: doc.prefix ?? DEFAULT_PREFIX,
    language: doc.language ?? DEFAULT_LANGUAGE,
    memoryEnabled: doc.memoryEnabled ?? true,
    summaryMessageLimit: doc.summaryMessageLimit ?? DEFAULT_SUMMARY_MESSAGE_LIMIT,
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export class SettingsRepository {
  /** Fetch (or lazily create with defaults) the settings for a guild. */
  async getOrCreate(guildId: string): Promise<GuildSettings> {
    const doc = await SettingsModel.findOneAndUpdate(
      { guildId },
      { $setOnInsert: { guildId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<SettingsEntity | null>();
    if (!doc) throw new Error(`Failed to get/create settings for ${guildId}`);
    return toSettings(doc);
  }

  async update(guildId: string, patch: GuildSettingsPatch): Promise<GuildSettings> {
    const set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) set[key] = value;
    }
    const doc = await SettingsModel.findOneAndUpdate(
      { guildId },
      { $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<SettingsEntity | null>();
    if (!doc) throw new Error(`Failed to update settings for ${guildId}`);
    return toSettings(doc);
  }

  async list(): Promise<GuildSettings[]> {
    const docs = await SettingsModel.find().lean<SettingsEntity[]>();
    return docs.map(toSettings);
  }

  async count(): Promise<number> {
    return SettingsModel.countDocuments().exec();
  }
}
