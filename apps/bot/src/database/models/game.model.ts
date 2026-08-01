import { Schema, model, type Model, type HydratedDocument } from 'mongoose';

export type GameType = 'hackbot' | 'guessprompt';

export interface GameEntity {
  channelId: string;
  guildId: string;
  gameType: GameType;
  secret: string; // Secret password for hackbot, or secret prompt/keywords for guessprompt
  hints: string[];
  attemptsCount: number;
  imageUrl?: string; // Image URL for guessprompt
  difficulty?: 'easy' | 'medium' | 'hard';
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<GameEntity>(
  {
    channelId: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true },
    gameType: { type: String, required: true },
    secret: { type: String, required: true },
    hints: { type: [String], default: [] },
    attemptsCount: { type: Number, default: 0 },
    imageUrl: { type: String },
    difficulty: { type: String, default: 'medium' },
    createdById: { type: String, required: true },
  },
  { timestamps: true, collection: 'games' },
);

export type GameDocument = HydratedDocument<GameEntity>;

export const GameModel: Model<GameEntity> = model<GameEntity>('Game', gameSchema);
