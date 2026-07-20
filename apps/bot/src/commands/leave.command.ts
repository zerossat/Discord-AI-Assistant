import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { leave } from '../utils/voice.manager';

export const leaveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.LEAVE)
    .setDescription('🔇 Cho bot rời khỏi kênh thoại')
    .setDMPermission(false),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'Lệnh này chỉ dùng trong server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const left = leave(interaction.guild.id);
    await interaction.reply({
      content: left ? '👋 Đã rời kênh thoại.' : 'Bot hiện không ở trong kênh thoại nào.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
