import { DEFAULT_LANGUAGE, type User } from '@daa/shared';
import { UserModel, type UserEntity } from '../models/user.model';

function toUser(doc: UserEntity): User {
  return {
    discordId: doc.discordId,
    username: doc.username,
    preferences: {
      language: doc.preferences?.language ?? DEFAULT_LANGUAGE,
      defaultTranslateTo: doc.preferences?.defaultTranslateTo ?? 'en',
      memoryEnabled: doc.preferences?.memoryEnabled ?? true,
    },
    totalTokens: doc.totalTokens ?? 0,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Data-access for users. The rest of the app depends on this class, never on
 * Mongoose directly (Repository Pattern).
 */
export class UserRepository {
  /** Create the user if missing, otherwise refresh the username. */
  async upsert(discordId: string, username: string): Promise<User> {
    const doc = await UserModel.findOneAndUpdate(
      { discordId },
      { $set: { username } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<UserEntity | null>();
    if (!doc) throw new Error(`Failed to upsert user ${discordId}`);
    return toUser(doc);
  }

  async findByDiscordId(discordId: string): Promise<User | null> {
    const doc = await UserModel.findOne({ discordId }).lean<UserEntity | null>();
    return doc ? toUser(doc) : null;
  }

  async incrementTokens(discordId: string, tokens: number): Promise<void> {
    if (tokens <= 0) return;
    await UserModel.updateOne({ discordId }, { $inc: { totalTokens: tokens } });
  }

  async updatePreferences(
    discordId: string,
    prefs: Partial<User['preferences']>,
  ): Promise<void> {
    const set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(prefs)) {
      if (value !== undefined) set[`preferences.${key}`] = value;
    }
    if (Object.keys(set).length === 0) return;
    await UserModel.updateOne({ discordId }, { $set: set });
  }

  /** List users (most active first) for the dashboard. */
  async list(limit = 200): Promise<User[]> {
    const docs = await UserModel.find()
      .sort({ totalTokens: -1 })
      .limit(limit)
      .lean<UserEntity[]>();
    return docs.map(toUser);
  }

  async count(): Promise<number> {
    return UserModel.countDocuments().exec();
  }

  async sumTokens(): Promise<number> {
    const rows = await UserModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$totalTokens' } } },
    ]);
    return rows[0]?.total ?? 0;
  }
}
