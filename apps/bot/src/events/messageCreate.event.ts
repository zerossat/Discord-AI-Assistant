import {
  Events,
  type Client,
  type Message,
  EmbedBuilder,
  AttachmentBuilder,
  GuildMember,
} from 'discord.js';
import { checkQuizChatMessage } from '../commands/quiz.command';
import type { ServiceContainer } from '../services';
import { childLogger } from '../utils/logger';
import { speak } from '../utils/voice.manager';
import type { TtsResult } from '../services/tts.service';

const log = childLogger('message-create');

export function registerMessageCreate(client: Client, services: ServiceContainer): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    // Không xử lý tin nhắn của Bot
    if (message.author.bot) return;

    const content = message.content.trim();

    // 1. Kiểm duyệt tin nhắn bằng AI Auto-Mod (nếu được bật trong Server)
    if (message.guild && content.length > 2) {
      try {
        const guildSettings = await services.repositories.settings.getOrCreate(message.guild.id);
        if (guildSettings.automodEnabled) {
          const modResult = await services.automod.checkMessage(content);
          if (modResult.toxic && modResult.severity !== 'low') {
            try {
              if (message.deletable) {
                await message.delete();
              }
            } catch (err) {
              log.warn({ err }, 'Failed to delete toxic message');
            }

            const warnEmbed = new EmbedBuilder()
              .setColor(0xe74c3c)
              .setTitle('🛡️ AI Auto-Mod Cảnh Báo')
              .setDescription(
                `Tin nhắn của **${message.author.username}** đã bị ẩn do vi phạm quy chuẩn cộng đồng.\n**Lý do:** ${modResult.reason}`,
              )
              .setFooter({ text: 'Hệ thống tự động bảo vệ môi trường chat lành mạnh' })
              .setTimestamp();

            await message.channel.send({ embeds: [warnEmbed] });
            return;
          }
        }
      } catch (err) {
        log.error({ err }, 'AutoMod execution failed');
      }
    }

    // 2. Tích lũy điểm kinh nghiệm XP & kiểm tra thăng cấp Level
    try {
      const randomXp = Math.floor(Math.random() * 11) + 15; // 15-25 XP
      const xpRes = await services.repositories.users.addXp(
        message.author.id,
        message.author.username,
        randomXp,
      );

      if (xpRes?.levelUp) {
        const levelEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🎉 Chúc Mừng Thăng Cấp!')
          .setDescription(
            `**${message.author.username}** vừa đạt **Cấp độ (Level) ${xpRes.newLevel}**! ✨\nHãy tiếp tục tương tác để nâng cao thứ hạng nhé!`,
          )
          .setThumbnail(message.author.displayAvatarURL())
          .setTimestamp();

        await message.channel.send({ embeds: [levelEmbed] });
      }
    } catch (err) {
      log.error({ err }, 'XP tracking failed');
    }

    // 3. Kiểm tra nếu có game HackBot hoặc Đoán Prompt đang chạy trong kênh
    try {
      if (message.guild) {
        const turingGame = await services.repositories.turing.findByGuildId(message.guild.id);
        if (turingGame && turingGame.status === 'court' && content.length > 3 && !content.startsWith('/')) {
          // If in court session, AI Chameleon has a 50% chance or when mentioned to auto-reply in defense!
          if (content.toLowerCase().includes(turingGame.persona.name.toLowerCase()) || Math.random() < 0.3) {
            const defenseText = await services.turing.respondToInterrogation(
              message.guild.id,
              content,
              message.author.username,
            );
            await message.reply(defenseText);
          }
        }
      }

      const activeGame = await services.repositories.games.getGameByChannel(message.channelId);
      if (activeGame) {
        if (activeGame.gameType === 'hackbot') {
          const res = await services.hackbot.processAttempt(message.channelId, content);
          if (res) {
            if (res.cracked) {
              await services.repositories.users.addXp(
                message.author.id,
                message.author.username,
                100,
              );
              const winEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🎉 HACK THÀNH CÔNG!')
                .setDescription(
                  res.aiResponse + '\n\n⭐ **Phần thưởng:** Bạn nhận được **+100 XP**!',
                )
                .setFooter({ text: `Người giải mã: ${message.author.username}` });
              await message.reply({ embeds: [winEmbed] });
            } else {
              const embed = new EmbedBuilder()
                .setColor(0x3498db)
                .setTitle(`🛡️ HackBot Guard (Lần thử #${res.attempts})`)
                .setDescription(
                  `**Hacker ${message.author.username}:** "${content}"\n\n**HackBot AI:**\n${res.aiResponse}`,
                )
                .setFooter({ text: 'Tiếp tục thử thách bằng cách gõ tin nhắn!' });
              await message.reply({ embeds: [embed] });
            }
            return;
          }
        } else if (activeGame.gameType === 'guessprompt') {
          const res = await services.guessprompt.processGuess(message.channelId, content);
          if (res) {
            if (res.correct) {
              await services.repositories.users.addXp(
                message.author.id,
                message.author.username,
                80,
              );
              const winEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('🎉 ĐOÁN ĐÚNG RỒI!')
                .setDescription(res.message + '\n\n⭐ **Phần thưởng:** Bạn nhận được **+80 XP**!')
                .setFooter({ text: `Người thắng cuộc: ${message.author.username}` });
              await message.reply({ embeds: [winEmbed] });
            } else {
              await message.reply(res.message);
            }
            return;
          }
        }
      }
    } catch (err) {
      log.error({ err }, 'active channel game check failed');
    }

    // 4. Kiểm tra nếu người dùng gõ đáp án câu đố Đuổi hình bắt chữ trực tiếp trong chat
    try {
      if (await checkQuizChatMessage(message)) return;
    } catch (err) {
      log.error({ err }, 'checkQuizChatMessage failed');
    }

    const lowerContent = content.toLowerCase();

    // 4. Hỗ trợ các từ khóa đọc TTS trực tiếp trong chat: "say", "tts", "nói"
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
      await message.reply(
        `... Vui lòng nhập nội dung cần đọc sau từ khoá \`${matchedTrigger}\` (Ví dụ: \`${matchedTrigger} Maly xin mẫu nơ với\`).`,
      );
      return;
    }

    // Hỗ trợ chọn engine bằng cách gõ: "say gemini nội dung cần đọc" hoặc "tts gemini ..."
    let engine = 'google';
    if (rawText.toLowerCase().startsWith('gemini ')) {
      engine = 'gemini';
      rawText = rawText.slice(7).trim();
    }

    if (!rawText) {
      await message.reply(
        `... Vui lòng nhập nội dung cần đọc sau từ khoá \`${matchedTrigger} gemini\`.`,
      );
      return;
    }

    const member = message.member instanceof GuildMember ? message.member : null;
    const channel = member?.voice.channel ?? null;
    if (!message.guild || !channel) {
      await message.reply('... Bạn cần vào một **kênh thoại** trước khi dùng lệnh đọc TTS nhé.');
      return;
    }

    const speakerName =
      member?.displayName ?? message.author.displayName ?? message.author.username;
    const spokenText = `${speakerName} đã nói: ${rawText}`;

    // 1) Tạo audio
    let audio: TtsResult;
    try {
      audio =
        engine === 'gemini'
          ? await services.tts.gemini(spokenText)
          : await services.tts.google(spokenText);
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

    // Phản hồi tin nhắn
    if (spoke) {
      await message.reply(`📢 ${speakerName} đã nói: **${rawText}**`);
    } else {
      const attachment = new AttachmentBuilder(audio.buffer, { name: `tts.${audio.ext}` });
      await message.reply({
        content: `📢 ${speakerName} đã nói: **${rawText}**\n⚠️ Không vào được kênh thoại (kiểm tra quyền **Connect/Speak** của bot). Đính kèm file âm thanh để bạn nghe tạm.`,
        files: [attachment],
      });
    }
  });
}
