import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildMenuOverviewEmbed, buildMenuRow } from './catalog';

export const menuCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.MENU)
    .setDescription('📋 Mở menu lệnh tương tác'),
  async execute(interaction) {
    await interaction.reply({
      embeds: [buildMenuOverviewEmbed()],
      components: [buildMenuRow()],
      flags: MessageFlags.Ephemeral,
    });
  },
};
