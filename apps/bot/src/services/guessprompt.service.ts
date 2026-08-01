import type { ImageService } from './image.service';
import type { GameRepository } from '../database/repositories/game.repository';
import { childLogger } from '../utils/logger';

const log = childLogger('guessprompt-service');

const PROMPT_TOPICS = [
  {
    secret: 'Mèo phi hành gia vũ trụ',
    keywords: ['mèo', 'cat', 'vũ trụ', 'astronaut', 'space'],
    prompt: 'a cute cat astronaut floating in deep space with colorful nebulae',
  },
  {
    secret: 'Rồng lửa phượng hoàng',
    keywords: ['rồng', 'dragon', 'lửa', 'fire', 'phoenix'],
    prompt: 'majestic glowing fire dragon flying around a volcanic mountain peak',
  },
  {
    secret: 'Thành phố Cyberpunk neon',
    keywords: ['cyberpunk', 'neon', 'thành phố', 'city', 'tương lai'],
    prompt: 'futuristic cyberpunk city with neon lights and flying cars at rainy night',
  },
  {
    secret: 'Lâu đài trên mây',
    keywords: ['lâu đài', 'castle', 'mây', 'cloud', 'bầu trời'],
    prompt: 'magical floating castle in soft pink and gold clouds at sunset',
  },
  {
    secret: 'Robot đánh đàn guitar',
    keywords: ['robot', 'guitar', 'nhạc', 'music'],
    prompt: 'a cool vintage robot playing an electric guitar on a concert stage',
  },
];

export interface GuessPromptResult {
  correct: boolean;
  message: string;
  secret: string;
  attempts: number;
}

export class GuessPromptService {
  constructor(
    private readonly imageService: ImageService,
    private readonly gameRepo: GameRepository,
  ) {}

  async startGame(
    channelId: string,
    guildId: string,
    userId: string,
  ): Promise<{ imageUrl: string; topicName: string }> {
    const topic = PROMPT_TOPICS[Math.floor(Math.random() * PROMPT_TOPICS.length)]!;
    const imageRes = await this.imageService.generateImage({ prompt: topic.prompt });

    await this.gameRepo.createGame({
      channelId,
      guildId,
      gameType: 'guessprompt',
      secret: topic.secret,
      hints: topic.keywords,
      imageUrl: imageRes.imageUrl,
      createdById: userId,
    });

    return {
      imageUrl: imageRes.imageUrl,
      topicName: topic.secret,
    };
  }

  async processGuess(channelId: string, userGuess: string): Promise<GuessPromptResult | null> {
    const game = await this.gameRepo.getGameByChannel(channelId);
    if (!game || game.gameType !== 'guessprompt') return null;

    const attempts = await this.gameRepo.incrementAttempts(channelId);
    const keywords = game.hints || [];
    const guessLower = userGuess.toLowerCase().trim();

    // Check if guess matches secret or any key keywords
    const matched =
      keywords.some((kw) => guessLower.includes(kw.toLowerCase())) ||
      guessLower.includes(game.secret.toLowerCase());

    if (matched) {
      await this.gameRepo.deleteGame(channelId);
      return {
        correct: true,
        message: `🎉 **CHÍNH XÁC!** Từ khóa bí mật chính là **${game.secret}**! Bạn đã đoán đúng sau ${attempts} lần thử!`,
        secret: game.secret,
        attempts,
      };
    }

    return {
      correct: false,
      message: `❌ **Chưa chính xác!** Gợi ý: từ khóa có liên quan đến các chủ đề thiên nhiên, giả tưởng hoặc khoa học viễn tưởng. (Lần thử #${attempts})`,
      secret: game.secret,
      attempts,
    };
  }

  async getHint(channelId: string): Promise<string | null> {
    const game = await this.gameRepo.getGameByChannel(channelId);
    if (!game || game.gameType !== 'guessprompt') return null;
    const keywords = game.hints || [];
    const sample = keywords[Math.floor(Math.random() * keywords.length)] || 'chủ đề tự nhiên';
    return `Từ khóa có chứa hoặc liên quan đến: "${sample.toUpperCase()}"`;
  }

  async stopGame(channelId: string): Promise<string | null> {
    const game = await this.gameRepo.getGameByChannel(channelId);
    if (!game || game.gameType !== 'guessprompt') return null;
    await this.gameRepo.deleteGame(channelId);
    return game.secret;
  }
}
