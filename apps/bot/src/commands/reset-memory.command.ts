import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const resetMemoryCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.RESET_MEMORY)
    .setDescription('Xoá bộ nhớ hội thoại của bạn trong ngữ cảnh này'),
  async execute(interaction, services) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await services.memory.reset(interaction.user.id, interaction.guildId);
    await interaction.editReply('🧹 Đã xoá bộ nhớ hội thoại của bạn trong ngữ cảnh này.');
  },
};
