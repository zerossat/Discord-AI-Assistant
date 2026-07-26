import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const resumeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.RESUME)
    .setDescription('▶️ Tiếp tục phát nhạc')
    .setDMPermission(false),
  async execute(interaction, services) {
    if (!interaction.guildId) return;

    const resumed = services.music.resume(interaction.guildId);
    if (resumed) {
      await interaction.reply('▶️ Đã tiếp tục phát nhạc.');
    } else {
      await interaction.reply({
        content: '❌ Không thể tiếp tục (nhạc đang phát hoặc không hoạt động).',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
