import type { GeminiService } from '../ai/gemini.service';
import type { UserRepository } from '../database/repositories/user.repository';
import type { UserTitle } from '@daa/shared';
import { childLogger } from '../utils/logger';

const log = childLogger('titles-service');

export class TitlesService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly userRepo: UserRepository,
  ) {}

  async generateTitleForUser(
    discordId: string,
    username: string,
    sampleMessages: string[],
  ): Promise<UserTitle> {
    const textContext =
      sampleMessages.length > 0
        ? sampleMessages.join('\n')
        : 'Thường xuyên nhắn tin trong server, tương tác tích cực và hòa đồng với mọi người.';

    try {
      const prompt = `Bạn là hệ thống AI Trọng Tài Danh Hiệu Hài Hước của Server Discord.
Dựa trên phong cách nhắn tin và nhật ký hoạt động sau đây của người dùng "${username}":

\`\`\`
${textContext.slice(0, 1500)}
\`\`\`

Hãy sáng tạo 1 danh hiệu hài hước độc quyền dành riêng cho người dùng này (ví dụ: "Chúa Tể Thức Khuya", "Thánh Cãi Bướng", "Chuyên Gia Thả Emoji", "Bậc Thầy Code Đêm", "Chiến Thần Chat Đêm").

CHỈ trả về JSON duy nhất theo định dạng sau (không kèm markdown khác):
{"title": "Tên danh hiệu (2-5 từ tiếng Việt)", "icon": "1 emoji phù hợp", "reason": "Giải thích hài hước 1 câu tại sao phong danh hiệu này"}`;

      const res = await this.gemini.generateText({
        contents: prompt,
        temperature: 0.8,
      });

      const cleanJson = res.text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const parsed = JSON.parse(cleanJson);

      const newTitle: UserTitle = {
        id: `title_${Date.now()}`,
        title: parsed.title || 'Thánh Tương Tác Server',
        icon: parsed.icon || '👑',
        reason: parsed.reason || 'Luôn có mặt và khuấy động không khí kênh chat!',
        awardedAt: new Date().toISOString(),
      };

      await this.userRepo.addTitle(discordId, username, newTitle);
      return newTitle;
    } catch (err) {
      log.error({ err }, 'Titles generation failed, fallback to default title');
      const fallbackTitle: UserTitle = {
        id: `title_${Date.now()}`,
        title: 'Chiến Thần Tương Tác',
        icon: '⚔️',
        reason: 'Nhiệt tình nhắn tin và đóng góp cho server!',
        awardedAt: new Date().toISOString(),
      };

      await this.userRepo.addTitle(discordId, username, fallbackTitle);
      return fallbackTitle;
    }
  }
}
