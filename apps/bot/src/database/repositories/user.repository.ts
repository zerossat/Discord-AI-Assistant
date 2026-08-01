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
    xp: doc.xp ?? 0,
    level: doc.level ?? 1,
    cards: doc.cards ?? [],
    titles: doc.titles ?? [],
    lastGachaAt: doc.lastGachaAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/** Calculate XP required to reach next level: 100 * level^1.5 */
export function getRequiredXpForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
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

  /** Add Gacha Card to user inventory. */
  async addGachaCard(discordId: string, username: string, card: any): Promise<User> {
    const doc = await UserModel.findOneAndUpdate(
      { discordId },
      {
        $set: { username, lastGachaAt: new Date() },
        $push: { cards: card },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<UserEntity | null>();
    if (!doc) throw new Error(`Failed to add gacha card for ${discordId}`);
    return toUser(doc);
  }

  /** Add awarded Title to user profile. */
  async addTitle(discordId: string, username: string, title: any): Promise<User> {
    const doc = await UserModel.findOneAndUpdate(
      { discordId },
      {
        $set: { username },
        $push: { titles: title },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<UserEntity | null>();
    if (!doc) throw new Error(`Failed to add title for ${discordId}`);
    return toUser(doc);
  }

  /** Add XP to user with 60-second cooldown check. Returns level-up info if leveled up. */
  async addXp(
    discordId: string,
    username: string,
    amount: number,
  ): Promise<{ user: User; levelUp: boolean; oldLevel: number; newLevel: number } | null> {
    const userDoc = await UserModel.findOne({ discordId });
    const now = new Date();

    if (userDoc) {
      // Cooldown check (60 seconds between XP gains)
      if (userDoc.lastXpAt && now.getTime() - userDoc.lastXpAt.getTime() < 60000) {
        return null;
      }
    }

    const currentXp = (userDoc?.xp ?? 0) + amount;
    let currentLevel = userDoc?.level ?? 1;
    const oldLevel = currentLevel;

    // Check level ups
    while (currentXp >= getRequiredXpForNextLevel(currentLevel)) {
      currentLevel++;
    }

    const levelUp = currentLevel > oldLevel;

    const updatedDoc = await UserModel.findOneAndUpdate(
      { discordId },
      {
        $set: {
          username,
          xp: currentXp,
          level: currentLevel,
          lastXpAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<UserEntity | null>();

    if (!updatedDoc) return null;

    return {
      user: toUser(updatedDoc),
      levelUp,
      oldLevel,
      newLevel: currentLevel,
    };
  }

  /** Get rank position of a user based on XP. */
  async getRank(
    discordId: string,
  ): Promise<{ rank: number; totalUsers: number; user: User } | null> {
    const userDoc = await UserModel.findOne({ discordId }).lean<UserEntity | null>();
    if (!userDoc) return null;

    const higherXpCount = await UserModel.countDocuments({ xp: { $gt: userDoc.xp } });
    const totalUsers = await UserModel.countDocuments({ xp: { $gt: 0 } });

    return {
      rank: higherXpCount + 1,
      totalUsers: Math.max(totalUsers, 1),
      user: toUser(userDoc),
    };
  }

  /** Get top users by XP for leaderboard. */
  async getTopUsersByXp(limit = 10): Promise<User[]> {
    const docs = await UserModel.find({ xp: { $gt: 0 } })
      .sort({ xp: -1 })
      .limit(limit)
      .lean<UserEntity[]>();
    return docs.map(toUser);
  }

  async updatePreferences(discordId: string, prefs: Partial<User['preferences']>): Promise<void> {
    const set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(prefs)) {
      if (value !== undefined) set[`preferences.${key}`] = value;
    }
    if (Object.keys(set).length === 0) return;
    await UserModel.updateOne({ discordId }, { $set: set });
  }

  /** List users (most active first) for the dashboard. */
  async list(limit = 200): Promise<User[]> {
    const docs = await UserModel.find().sort({ totalTokens: -1 }).limit(limit).lean<UserEntity[]>();
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
