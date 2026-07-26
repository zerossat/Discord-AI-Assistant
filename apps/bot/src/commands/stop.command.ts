import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const stopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.STOP)
    .setDescription('⏹️ Dừng phát nhạc, xoá danh sách phát và rời kênh thoại')
    .setDMPermission(false),
  async execute(interaction, services) {
    if (!interaction.guildId) return;

    if (!services.music.hasSession(interaction.guildId)) {
      await interaction.reply({
        content: '❌ Hiện không có bài phát nhạc nào hoạt động.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    services.music.stop(interaction.guildId);
    await interaction.reply('⏹️ Đã dừng phát nhạc, xoá danh sách phát và ngắt kết nối thoại.');
  },
};
