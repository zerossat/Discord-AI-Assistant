import { Events, type Client, type Message, EmbedBuilder, AttachmentBuilder, GuildMember } from 'discord.js';
import type { ServiceContainer } from '../services';
import { childLogger } from '../utils/logger';
import { speak } from '../utils/voice.manager';
import type { TtsResult } from '../services/tts.service';

const log = childLogger('message-tts');

export function registerMessageCreate(client: Client, services: ServiceContainer): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    // Không xử lý tin nhắn của Bot
    if (message.author.bot) return;

    const content = message.content.trim();
    const lowerContent = content.toLowerCase();

    // Kiểm tra xem tin nhắn có bắt đầu bằng từ khóa "tts" không
    if (!lowerContent.startsWith('tts')) return;

    // Đảm bảo từ khóa là "tts" độc lập (ví dụ: "tts hello" chứ không phải "ttshere")
    const nextChar = content.charAt(3);
    if (nextChar !== '' && nextChar !== ' ' && nextChar !== '\n') return;

    let rawText = content.slice(3).trim();
    if (!rawText) {
      await message.reply('🔇 Vui lòng nhập nội dung cần đọc sau từ khoá `tts` (Ví dụ: `tts Xin chào`).');
      return;
    }

    // Hỗ trợ chọn engine bằng cách gõ: "tts gemini nội dung cần đọc"
    let engine = 'google';
    if (rawText.toLowerCase().startsWith('gemini ')) {
      engine = 'gemini';
      rawText = rawText.slice(7).trim();
    }

    if (!rawText) {
      await message.reply('🔇 Vui lòng nhập nội dung cần đọc sau từ khoá `tts gemini`.');
      return;
    }

    const member = message.member instanceof GuildMember ? message.member : null;
    const channel = member?.voice.channel ?? null;
    if (!message.guild || !channel) {
      await message.reply('🔇 Bạn cần vào một **kênh thoại** trước khi dùng lệnh `tts` nhé.');
      return;
    }

    // 1) Tạo audio
    let audio: TtsResult;
    try {
      audio = engine === 'gemini' ? await services.tts.gemini(rawText) : await services.tts.google(rawText);
    } catch (err) {
      if (engine === 'gemini') {
        log.warn({ err }, 'Gemini TTS lỗi — chuyển sang Google');
        try {
          audio = await services.tts.google(rawText);
        } catch (innerErr) {
          log.error({ err: innerErr }, 'Google fallback failed');
          await message.reply('⚠️ Lỗi: Không thể kết xuất âm thanh từ Google và Gemini.');
          return;
        }
      } else {
        log.error({ err }, 'Google TTS failed');
        await message.reply('⚠️ Lỗi: Không thể kết xuất âm thanh từ Google.');
        return;
      }
    }

    // 2) Phát âm thanh trong kênh thoại
    let spoke = false;
    try {
      await speak(channel, audio.buffer);
      spoke = true;
    } catch (err) {
      log.warn({ err }, 'không phát được trong kênh thoại');
    }

    // Nếu không vào được kênh thoại, gửi file đính kèm làm phương án dự phòng
    if (!spoke) {
      const attachment = new AttachmentBuilder(audio.buffer, { name: `tts.${audio.ext}` });
      await message.reply({
        content: '⚠️ Không vào được kênh thoại (kiểm tra quyền **Connect/Speak** của bot). Đính kèm file âm thanh để bạn nghe tạm.',
        files: [attachment]
      });
    }
  });
}
