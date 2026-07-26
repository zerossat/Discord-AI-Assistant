import {
  AttachmentBuilder,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import type { TtsResult } from '../services/tts.service';
import { speak } from '../utils/voice.manager';
import { childLogger } from '../utils/logger';

const log = childLogger('tts');

export const ttsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.TTS)
    .setDescription('🔊 Chuyển văn bản thành giọng nói trong kênh thoại')
    .setDMPermission(false)
    .addStringOption((o) =>
      o
        .setName('noi-dung')
        .setDescription('Văn bản cần đọc')
        .setRequired(true)
        .setMaxLength(600),
    )
    .addStringOption((o) =>
      o
        .setName('giong')
        .setDescription('Chọn giọng đọc (mặc định: Google)')
        .addChoices(
          { name: 'Google (miễn phí)', value: 'google' },
          { name: 'Gemini (tự nhiên)', value: 'gemini' },
        ),
    ),
  async execute(interaction, services) {
    const text = interaction.options.getString('noi-dung', true);
    const engine = interaction.options.getString('giong') ?? 'google';

    const member = interaction.member instanceof GuildMember ? interaction.member : null;
    const channel = member?.voice.channel ?? null;
    if (!interaction.guild || !channel) {
      await interaction.reply({
        content: '🔇 Bạn cần vào một **kênh thoại** trước khi dùng `/tts` nhé.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const speakerName = member?.displayName ?? interaction.user.displayName ?? interaction.user.username;
    const spokenText = `${speakerName} đã nói: ${text}`;

    // 1) Tạo audio. Nếu chọn Gemini mà lỗi (vd: hết quota) → tự chuyển sang Google.
    let audio: TtsResult;
    let usedVoice = engine === 'gemini' ? 'Gemini' : 'Google';
    try {
      audio = engine === 'gemini' ? await services.tts.gemini(spokenText) : await services.tts.google(spokenText);
    } catch (err) {
      if (engine === 'gemini') {
        log.warn({ err }, 'Gemini TTS lỗi — chuyển sang Google');
        usedVoice = 'Google (dự phòng)';
        audio = await services.tts.google(spokenText);
      } else {
        throw err;
      }
    }

    // 2) Phát trong kênh thoại và GIỮ kết nối (không tự rời).
    let spoke = false;
    try {
      await speak(channel, audio.buffer, services.music);
      spoke = true;
    } catch (err) {
      log.warn({ err }, 'không phát được trong kênh thoại');
    }

    const status = spoke
      ? `Đang đọc trong 🔊 **${channel.name}** — bot sẽ ở lại đến khi kênh trống (hoặc gõ \`/leave\` để rời).`
      : '⚠️ Không vào được kênh thoại (kiểm tra quyền **Connect/Speak** của bot). Đính kèm file âm thanh để bạn nghe tạm.';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔊 Text-to-Speech')
      .setDescription(`📢 **${speakerName}** đã nói: **${text.slice(0, 500)}**\n\n${status}\n\n**Giọng:** ${usedVoice}`);

    if (spoke) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      const attachment = new AttachmentBuilder(audio.buffer, { name: `tts.${audio.ext}` });
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    }
  },
};
