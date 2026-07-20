import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const statsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.STATS)
    .setDescription('Thống kê sử dụng bot — Bot usage statistics'),
  async execute(interaction, services) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const s = await services.stats.getStats();
    const embed = new EmbedBuilder()
      .setTitle('📊 Thống kê sử dụng')
      .setColor(0x57f287)
      .addFields(
        { name: '👥 Users', value: s.totalUsers.toLocaleString(), inline: true },
        { name: '💬 Conversations', value: s.totalConversations.toLocaleString(), inline: true },
        { name: '🏠 Guilds', value: s.totalGuilds.toLocaleString(), inline: true },
        { name: '✉️ Messages', value: s.totalMessages.toLocaleString(), inline: true },
        { name: '🔢 AI Tokens', value: s.totalTokens.toLocaleString(), inline: true },
      )
      .setFooter({ text: `Tạo lúc ${new Date(s.generatedAt).toLocaleString()}` });
    await interaction.editReply({ embeds: [embed] });
  },
};
