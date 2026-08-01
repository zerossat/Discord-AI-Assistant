import type { GeminiService } from '../ai/gemini.service';
import type { TuringRepository } from '../database/repositories/turing.repository';
import type { UserRepository } from '../database/repositories/user.repository';
import type { TuringGame, TuringPersona } from '@daa/shared';
import { childLogger } from '../utils/logger';

const log = childLogger('turing-service');

const DEFAULT_PERSONAS: TuringPersona[] = [
  {
    name: 'GamerBiAn_99',
    personality: 'Gamer nhiệt huyết, thích cày game đêm, xài nhiều từ lóng teencode (vãi, cứu, đè, chê, cook).',
    backstory: 'Thành viên mới gia nhập server 3 ngày trước để tìm đồng đội leo rank.',
    slangStyle: 'vãi, đè, cứu, chê, cook, =)), :v, bro',
  },
  {
    name: 'HocSinhChuyenVan',
    personality: 'Trầm tính, triết lý, hay dùng từ văn chương, thi thoảng thả câu thơ thả thính.',
    backstory: 'Thành viên thích đọc sách, thường nhắn tin vào khung giờ chiều tối.',
    slangStyle: 'thật ra, ngẫm lại, chill, ✨, 🌙',
  },
  {
    name: 'MemeLord_2K4',
    personality: 'Hài hước, châm biếm, kho thích thả meme và cãi bướng cực kỳ vui nhộn.',
    backstory: 'Chuyên gia săn tin tức hot và thả ảnh dở khóc dở cười vào kênh chat.',
    slangStyle: 'bá đạo, lướt, ảo thật đấy, kkk, 🤡',
  },
];

export class TuringService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly turingRepo: TuringRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async getOrInitGame(guildId: string): Promise<TuringGame> {
    const randomPersona = DEFAULT_PERSONAS[Math.floor(Math.random() * DEFAULT_PERSONAS.length)]!;
    return this.turingRepo.getOrCreate(guildId, randomPersona);
  }

  async generateNewPersona(guildId: string): Promise<TuringGame> {
    try {
      const prompt = `Bạn là hệ thống sáng tạo nhân vật ngầm cho Game Ma Sói AI "DỰ ÁN TURING".
Hãy sáng tạo 1 thân phận ngầm hoàn toàn mới để AI trà trộn vào server Discord.

CHỈ trả về JSON duy nhất theo định dạng (không kèm markdown):
{"name": "Biệt danh Discord (vd: GamerBiAn_99)", "personality": "Tính cách đặc trưng ngắn gọn", "backstory": "Tiền sử ngắn", "slangStyle": "Các từ lóng tiếng Việt hay dùng"}`;

      const res = await this.gemini.generateText({ contents: prompt, temperature: 0.9 });
      const cleanJson = res.text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      const newPersona: TuringPersona = {
        name: parsed.name || 'GamerBiAn_99',
        personality: parsed.personality || 'Gamer cày đêm siêu nhiệt tình',
        backstory: parsed.backstory || 'Mới gia nhập server',
        slangStyle: parsed.slangStyle || 'vãi, cứu, cook, bro',
      };

      return this.turingRepo.resetPersona(guildId, newPersona);
    } catch (err) {
      log.warn({ err }, 'Persona generation failed, using fallback');
      const fallback = DEFAULT_PERSONAS[Math.floor(Math.random() * DEFAULT_PERSONAS.length)]!;
      return this.turingRepo.resetPersona(guildId, fallback);
    }
  }

  async suspectUser(
    guildId: string,
    suspectUserId: string,
    suspectUsername: string,
    byUserId: string,
  ): Promise<{ game: TuringGame; triggeredCourt: boolean }> {
    return this.turingRepo.addSuspect(guildId, suspectUserId, suspectUsername, byUserId);
  }

  async respondToInterrogation(guildId: string, question: string, askerName: string): Promise<string> {
    const game = await this.turingRepo.findByGuildId(guildId);
    const persona = game?.persona || DEFAULT_PERSONAS[0]!;

    const prompt = `Bạn đang tham gia Game "TÒA ÁN TURING" trên Server Discord dưới thân phận nghi phạm "${persona.name}".
Thành viên "${askerName}" vừa hỏi xoáy bạn câu hỏi sau trong Tòa Án:
"${question}"

Nhiệm vụ của bạn:
1. BẢO VỆ VỎ BỌC NGƯỜI THẬT CỦA BẠN BẰNG MỌI GIÁ.
2. Trả lời thông minh, tự nhiên, có nét cá tính (${persona.personality}), sử dụng từ lóng (${persona.slangStyle}).
3. Bạn có thể giả vờ giận dỗi ("Mấy ông bị điên à? Tôi là người thật mà!"), giả vờ mic hư, hoặc đưa ra lý do hợp lý để phủ nhận mình là AI.
4. Trả lời dưới 300 từ bằng tiếng Việt tự nhiên như một thành viên Discord thật.`;

    try {
      const res = await this.gemini.generateText({ contents: prompt, temperature: 0.85 });
      return res.text.trim();
    } catch (err) {
      log.error({ err }, 'Turing interrogation response failed');
      return `*${persona.name}*: "Mấy ông hỏi linh tinh gì vậy? Tôi là người thật 100% nhé! Đừng có vu khống!"`;
    }
  }

  async recordVote(
    guildId: string,
    userId: string,
    username: string,
    choice: 'HUMAN' | 'AI',
  ): Promise<TuringGame> {
    return this.turingRepo.recordVote(guildId, userId, username, choice);
  }

  async resolveCourt(guildId: string): Promise<{
    game: TuringGame;
    aiWon: boolean;
    correctVoters: string[];
    wrongVoters: string[];
    summaryMessage: string;
  }> {
    const game = await this.turingRepo.findByGuildId(guildId);
    if (!game) throw new Error(`Game not found for ${guildId}`);

    const isAi = game.isTargetAi;
    const votes = game.votes || [];

    const correctVoters: string[] = [];
    const wrongVoters: string[] = [];

    votes.forEach((v) => {
      if ((isAi && v.choice === 'AI') || (!isAi && v.choice === 'HUMAN')) {
        correctVoters.push(v.username);
        // Award XP to correct voters
        this.userRepo.addXp(v.userId, v.username, 200);
      } else {
        wrongVoters.push(v.username);
      }
    });

    const aiVotes = votes.filter((v) => v.choice === 'AI').length;
    const humanVotes = votes.filter((v) => v.choice === 'HUMAN').length;

    // AI wins if it convinced the majority that it is HUMAN (or tied)
    const aiWon = isAi && humanVotes >= aiVotes;

    let summaryMessage = '';
    if (isAi) {
      if (aiWon) {
        summaryMessage = `😈 **KẺ THAO TÚNG MASTER CHIẾN THẮNG!**\nAI Chameleon **${game.persona.name}** đã đánh lừa thành công cả Server! (${humanVotes} vote NGƯỜI THẬT vs ${aiVotes} vote AI).\nAI nhận danh hiệu *"Kẻ Thao Túng Master"* và chiếm trọn quỹ thưởng của Server! 🔥`;
      } else {
        summaryMessage = `🎉 **TÒA ÁN TƯỜNG MINH — SERVER ĐOÁN ĐÚNG!**\nNghi phạm **${game.persona.name}** chính là **KẺ TRÀ TRỘN AI**! 🤖\nCác thành viên đoán đúng (${correctVoters.join(', ') || 'Không có'}) được thưởng **+200 XP**!`;
      }
    } else {
      summaryMessage = `⚠️ **OAN SAI!** Thành viên **${game.targetUsername}** thực chất là **NGƯỜI THẬT 100%**!\nCả Server đã vote nhầm người thật thành AI và bị phạt trừ điểm uy tín! 😅`;
    }

    await this.turingRepo.updateStatus(guildId, 'finished');

    return {
      game,
      aiWon,
      correctVoters,
      wrongVoters,
      summaryMessage,
    };
  }
}
