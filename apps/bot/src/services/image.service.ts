import type { GeminiService } from '../ai/gemini.service';
import { childLogger } from '../utils/logger';

const log = childLogger('image-service');

export interface ImageGenerationOptions {
  prompt: string;
  style?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  enhancedPrompt: string;
}

export class ImageService {
  constructor(private readonly gemini: GeminiService) {}

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { prompt, style } = options;
    let enhancedPrompt = prompt;

    // Enhance prompt using Gemini for richer artistic details
    try {
      const enhanceRequest = `Bạn là chuyên gia thiết kế prompt cho AI sinh ảnh (Text-to-Image). 
Hãy tinh chỉnh prompt tiếng Việt/Anh sau thành 1 câu prompt tiếng Anh giàu chi tiết nghệ thuật, điện ảnh, ánh sáng đẹp (dưới 100 từ).
${style ? `Phong cách nghệ thuật mong muốn: ${style}` : ''}
Prompt gốc: "${prompt}"

CHỈ trả về prompt tiếng Anh đã tinh chỉnh (không kèm giải thích nào khác).`;

      const aiRes = await this.gemini.generateText({
        contents: enhanceRequest,
        temperature: 0.7,
      });

      if (aiRes.text && aiRes.text.trim().length > 5) {
        enhancedPrompt = aiRes.text.trim();
      }
    } catch (err) {
      log.warn({ err }, 'Gemini prompt enhancement failed, using raw prompt');
    }

    if (style && !enhancedPrompt.toLowerCase().includes(style.toLowerCase())) {
      enhancedPrompt += `, ${style} style, 8k resolution, highly detailed`;
    }

    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

    return {
      imageUrl,
      enhancedPrompt,
    };
  }
}
