import type { GeminiService } from '../ai/gemini.service';
import { childLogger } from '../utils/logger';

const log = childLogger('automod-service');

export interface AutoModResult {
  toxic: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export class AutoModService {
  constructor(private readonly gemini: GeminiService) {}

  async checkMessage(content: string): Promise<AutoModResult> {
    if (!content || content.length < 3) {
      return { toxic: false, reason: '', severity: 'low' };
    }

    try {
      const prompt = `Bạn là hệ thống kiểm duyệt tin nhắn Discord (Auto-Mod AI).
Hãy phân tích đoạn tin nhắn sau và xác định xem tin nhắn có chứa nội dung độc hại, xúc phạm nặng nề, quấy rối, ngôn từ thù hận, hoặc phỉ báng không.

Tin nhắn: "${content.replace(/"/g, '\\"')}"

CHỈ trả về kết quả dưới định dạng JSON duy nhất như sau (không kèm bối cảnh khác hay Markdown codeblock):
{"toxic": true/false, "reason": "Lý do ngắn gọn bằng tiếng Việt nếu toxic", "severity": "low"/"medium"/"high"}`;

      const res = await this.gemini.generateText({
        contents: prompt,
        temperature: 0.1,
      });

      const cleanJson = res.text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const parsed = JSON.parse(cleanJson) as AutoModResult;

      return {
        toxic: Boolean(parsed.toxic),
        reason: parsed.reason || 'Chứa ngôn từ không phù hợp',
        severity: parsed.severity || (parsed.toxic ? 'medium' : 'low'),
      };
    } catch (err) {
      log.error({ err, content }, 'AutoMod analysis failed, failing safe');
      return { toxic: false, reason: '', severity: 'low' };
    }
  }
}
