import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { getRequiredXpForNextLevel } from '../database/repositories/user.repository';

export const rankCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.RANK)
    .setDescription('Xem thẻ Cấp độ (Level) và điểm XP — View level & XP rank card')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Người dùng cần xem (mặc định là bản thân) / Target user')
        .setRequired(false),
    ),
  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    const targetUser = interaction.options.getUser('user') ?? interaction.user;

    const rankInfo = await services.repositories.users.getRank(targetUser.id);

    if (!rankInfo || rankInfo.user.xp === undefined || rankInfo.user.xp === 0) {
      await interaction.editReply({
        content: `ℹ️ **${targetUser.username}** chưa có điểm XP nào. Hãy tích cực nhắn tin trong server để nhận XP nhé!`,
      });
      return;
    }

    const { rank, totalUsers, user } = rankInfo;
    const currentXp = user.xp ?? 0;
    const currentLevel = user.level ?? 1;
    const nextLevelXp = getRequiredXpForNextLevel(currentLevel);
    const prevLevelXp = getRequiredXpForNextLevel(Math.max(1, currentLevel - 1));

    const levelXpProgress = Math.max(0, currentXp - (currentLevel === 1 ? 0 : prevLevelXp));
    const levelXpNeeded = Math.max(1, nextLevelXp - (currentLevel === 1 ? 0 : prevLevelXp));
    const percentage = Math.min(100, Math.floor((levelXpProgress / levelXpNeeded) * 100));

    // Create ASCII progress bar
    const barLength = 15;
    const filled = Math.round((percentage / 100) * barLength);
    const progressBar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🏆 Thẻ Cấp độ — ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🎖️ Thứ hạng', value: `#${rank} / ${totalUsers}`, inline: true },
        { name: '⭐ Cấp độ (Level)', value: `Level **${currentLevel}**`, inline: true },
        { name: '✨ Tổng XP', value: `**${currentXp.toLocaleString()}** XP`, inline: true },
        {
          name: `📈 Tiến trình lên Level ${currentLevel + 1} (${percentage}%)`,
          value: `\`[${progressBar}]\` ${currentXp}/${nextLevelXp} XP`,
        },
      )
      .setFooter({ text: 'Nhắn tin để nhận thêm điểm kinh nghiệm XP!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
