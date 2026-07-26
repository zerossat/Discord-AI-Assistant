import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const pauseCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.PAUSE)
    .setDescription('⏸️ Tạm dừng phát nhạc')
    .setDMPermission(false),
  async execute(interaction, services) {
    if (!interaction.guildId) return;

    const paused = services.music.pause(interaction.guildId);
    if (paused) {
      await interaction.reply('⏸️ Đã tạm dừng nhạc.');
    } else {
      await interaction.reply({
        content: '❌ Không thể tạm dừng (nhạc đang dừng hoặc không phát).',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
