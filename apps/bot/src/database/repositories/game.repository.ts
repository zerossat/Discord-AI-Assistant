import { GameModel, type GameEntity, type GameType } from '../models/game.model';

export class GameRepository {
  async createGame(data: {
    channelId: string;
    guildId: string;
    gameType: GameType;
    secret: string;
    hints?: string[];
    imageUrl?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    createdById: string;
  }): Promise<GameEntity> {
    const doc = await GameModel.findOneAndUpdate(
      { channelId: data.channelId },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<GameEntity>();
    return doc;
  }

  async getGameByChannel(channelId: string): Promise<GameEntity | null> {
    return GameModel.findOne({ channelId }).lean<GameEntity | null>();
  }

  async incrementAttempts(channelId: string): Promise<number> {
    const doc = await GameModel.findOneAndUpdate(
      { channelId },
      { $inc: { attemptsCount: 1 } },
      { new: true },
    ).lean<GameEntity | null>();
    return doc?.attemptsCount ?? 0;
  }

  async deleteGame(channelId: string): Promise<void> {
    await GameModel.deleteOne({ channelId });
  }
}
