import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const leaderboardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.TOP)
    .setDescription('Xem Bảng xếp hạng XP cao thủ Server'),
  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const topUsers = await services.repositories.users.getTopUsersByXp(10);

    if (topUsers.length === 0) {
      await interaction.editReply({
        content:
          'ℹ️ Chưa có ai trên bảng xếp hạng XP. Hãy nhắn tin để nhận những điểm XP đầu tiên!',
      });
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = topUsers.map((user, idx) => {
      const medal = medals[idx] ?? `**#${idx + 1}**`;
      const xpStr = (user.xp ?? 0).toLocaleString();
      return `${medal} **${user.username}** — Level **${user.level ?? 1}** (${xpStr} XP)`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🏆 Bảng Xếp Hạng Cao Thủ Server')
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: 'Top 10 thành viên tích cực nhất · Tương tác để tăng điểm XP' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
