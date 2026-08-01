import { Events, type Client, type Message, EmbedBuilder, AttachmentBuilder, GuildMember } from 'discord.js';
import { checkQuizChatMessage } from '../commands/quiz.command';
import type { ServiceContainer } from '../services';
import { childLogger } from '../utils/logger';
import { speak } from '../utils/voice.manager';
import type { TtsResult } from '../services/tts.service';

const log = childLogger('message-tts');

export function registerMessageCreate(client: Client, services: ServiceContainer): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    // Không xử lý tin nhắn của Bot
    if (message.author.bot) return;

    // 1. Kiểm tra nếu người dùng gõ đáp án câu đố Đuổi hình bắt chữ trực tiếp trong chat
    try {
      if (await checkQuizChatMessage(message)) return;
    } catch (err) {
      log.error({ err }, 'checkQuizChatMessage failed');
    }

    const content = message.content.trim();
    const lowerContent = content.toLowerCase();

    // Hỗ trợ các từ khóa đọc TTS trực tiếp trong chat: "say", "tts", "nói"
    const triggers = ['say', 'tts', 'nói'];
    let matchedTrigger: string | null = null;

    for (const trigger of triggers) {
      if (lowerContent.startsWith(trigger)) {
        const nextChar = content.charAt(trigger.length);
        if (nextChar === '' || nextChar === ' ' || nextChar === '\n') {
          matchedTrigger = trigger;
          break;
        }
      }
    }

    if (!matchedTrigger) return;

    let rawText = content.slice(matchedTrigger.length).trim();
    if (!rawText) {
      await message.reply(`... Vui lòng nhập nội dung cần đọc sau từ khoá \`${matchedTrigger}\` (Ví dụ: \`${matchedTrigger} Maly xin mẫu nơ với\`).`);
      return;
    }

    // Hỗ trợ chọn engine bằng cách gõ: "say gemini nội dung cần đọc" hoặc "tts gemini ..."
    let engine = 'google';
    if (rawText.toLowerCase().startsWith('gemini ')) {
      engine = 'gemini';
      rawText = rawText.slice(7).trim();
    }

    if (!rawText) {
      await message.reply(`... Vui lòng nhập nội dung cần đọc sau từ khoá \`${matchedTrigger} gemini\`.`);
      return;
    }

    const member = message.member instanceof GuildMember ? message.member : null;
    const channel = member?.voice.channel ?? null;
    if (!message.guild || !channel) {
      await message.reply('... Bạn cần vào một **kênh thoại** trước khi dùng lệnh đọc TTS nhé.');
      return;
    }

    const speakerName = member?.displayName ?? message.author.displayName ?? message.author.username;
    const spokenText = `${speakerName} đã nói: ${rawText}`;

    // 1) Tạo audio
    let audio: TtsResult;
    try {
      audio = engine === 'gemini' ? await services.tts.gemini(spokenText) : await services.tts.google(spokenText);
    } catch (err) {
      if (engine === 'gemini') {
        log.warn({ err }, 'Gemini TTS lỗi — chuyển sang Google');
        try {
          audio = await services.tts.google(spokenText);
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
      await speak(channel, audio.buffer, services.music);
      spoke = true;
    } catch (err) {
      log.warn({ err }, 'không phát được trong kênh thoại');
    }

    // Phản hồi tin nhắn khớp hoàn toàn mẫu ảnh: 📢 <Tên_Người_Dùng> đã nói: **<Nội_dung>**
    if (spoke) {
      await message.reply(`📢 ${speakerName} đã nói: **${rawText}**`);
    } else {
      // Nếu không vào được kênh thoại, gửi file đính kèm làm phương án dự phòng
      const attachment = new AttachmentBuilder(audio.buffer, { name: `tts.${audio.ext}` });
      await message.reply({
        content: `📢 ${speakerName} đã nói: **${rawText}**\n⚠️ Không vào được kênh thoại (kiểm tra quyền **Connect/Speak** của bot). Đính kèm file âm thanh để bạn nghe tạm.`,
        files: [attachment],
      });
    }
  });
}
