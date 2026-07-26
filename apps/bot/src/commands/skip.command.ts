import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const skipCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.SKIP)
    .setDescription('⏭️ Bỏ qua bài hát hiện tại')
    .setDMPermission(false),
  async execute(interaction, services) {
    if (!interaction.guildId) return;

    if (!services.music.hasSession(interaction.guildId)) {
      await interaction.reply({
        content: '❌ Hiện không có bài hát nào đang phát.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    services.music.skip(interaction.guildId);
    await interaction.reply('⏭️ Đã bỏ qua bài hát hiện tại.');
  },
};
