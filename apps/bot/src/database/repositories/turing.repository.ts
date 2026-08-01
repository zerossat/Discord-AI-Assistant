import type { TuringGame } from '@daa/shared';
import { TuringModel, type TuringEntity } from '../models/turing.model';

function toTuringGame(doc: TuringEntity): TuringGame {
  return {
    guildId: doc.guildId,
    channelId: doc.channelId,
    status: doc.status,
    persona: {
      name: doc.persona.name,
      avatarUrl: doc.persona.avatarUrl,
      personality: doc.persona.personality,
      backstory: doc.persona.backstory,
      slangStyle: doc.persona.slangStyle,
    },
    isTargetAi: doc.isTargetAi,
    targetUserId: doc.targetUserId,
    targetUsername: doc.targetUsername,
    suspicionCount: doc.suspicionCount ?? 0,
    suspectedBy: doc.suspectedBy ?? [],
    votes: (doc.votes || []).map((v) => ({
      userId: v.userId,
      username: v.username,
      choice: v.choice,
      votedAt: v.votedAt?.toISOString() ?? new Date().toISOString(),
    })),
    courtExpiresAt: doc.courtExpiresAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export class TuringRepository {
  async getOrCreate(
    guildId: string,
    defaultPersona: TuringEntity['persona'],
  ): Promise<TuringGame> {
    let doc = await TuringModel.findOne({ guildId }).lean<TuringEntity | null>();
    if (!doc) {
      doc = await TuringModel.create({
        guildId,
        persona: defaultPersona,
        targetUserId: 'chameleon_ai_bot',
        targetUsername: defaultPersona.name,
        isTargetAi: true,
        status: 'stealth',
        suspicionCount: 0,
        suspectedBy: [],
        votes: [],
      });
    }
    return toTuringGame(doc);
  }

  async findByGuildId(guildId: string): Promise<TuringGame | null> {
    const doc = await TuringModel.findOne({ guildId }).lean<TuringEntity | null>();
    return doc ? toTuringGame(doc) : null;
  }

  async addSuspect(
    guildId: string,
    suspectUserId: string,
    suspectUsername: string,
    byUserId: string,
  ): Promise<{ game: TuringGame; triggeredCourt: boolean }> {
    const game = await TuringModel.findOne({ guildId });
    if (!game) throw new Error(`No Turing game found for ${guildId}`);

    if (!game.suspectedBy.includes(byUserId)) {
      game.suspectedBy.push(byUserId);
      game.suspicionCount += 1;
    }

    let triggeredCourt = false;
    // Trigger court when suspicion count reaches 3
    if (game.suspicionCount >= 3 && game.status === 'stealth') {
      game.status = 'court';
      game.courtExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes court
      triggeredCourt = true;
    }

    await game.save();
    return { game: toTuringGame(game.toObject()), triggeredCourt };
  }

  async recordVote(
    guildId: string,
    userId: string,
    username: string,
    choice: 'HUMAN' | 'AI',
  ): Promise<TuringGame> {
    const game = await TuringModel.findOne({ guildId });
    if (!game) throw new Error(`No Turing game found for ${guildId}`);

    const existingIdx = game.votes.findIndex((v) => v.userId === userId);
    if (existingIdx >= 0) {
      game.votes[existingIdx]!.choice = choice;
      game.votes[existingIdx]!.votedAt = new Date();
    } else {
      game.votes.push({ userId, username, choice, votedAt: new Date() });
    }

    await game.save();
    return toTuringGame(game.toObject());
  }

  async resetPersona(
    guildId: string,
    newPersona: TuringEntity['persona'],
  ): Promise<TuringGame> {
    const doc = await TuringModel.findOneAndUpdate(
      { guildId },
      {
        $set: {
          persona: newPersona,
          targetUserId: 'chameleon_ai_bot',
          targetUsername: newPersona.name,
          isTargetAi: true,
          status: 'stealth',
          suspicionCount: 0,
          suspectedBy: [],
          votes: [],
          courtExpiresAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<TuringEntity>();
    return toTuringGame(doc);
  }

  async updateStatus(
    guildId: string,
    status: 'stealth' | 'court' | 'finished',
  ): Promise<TuringGame> {
    const doc = await TuringModel.findOneAndUpdate(
      { guildId },
      { $set: { status } },
      { new: true },
    ).lean<TuringEntity>();
    if (!doc) throw new Error(`Game not found for ${guildId}`);
    return toTuringGame(doc);
  }
}
