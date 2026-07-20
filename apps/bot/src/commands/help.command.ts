import { SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildHelpEmbed } from './catalog';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.HELP)
    .setDescription('❓ Xem danh sách tất cả lệnh'),
  async execute(interaction) {
    await interaction.reply({ embeds: [buildHelpEmbed()] });
  },
};
