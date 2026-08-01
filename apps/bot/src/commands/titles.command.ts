import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const titlesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.TITLES)
    .setDescription(
      '👑 Hệ thống Danh hiệu Hài hước AI — AI đọc thói quen chat và trao danh hiệu độc quyền',
    )
    .addSubcommand((sc) =>
      sc
        .setName('view')
        .setDescription('Xem các danh hiệu hiện có của bạn')
        .addUserOption((o) => o.setName('user').setDescription('Người dùng cần xem danh hiệu')),
    )
    .addSubcommand((sc) =>
      sc
        .setName('claim')
        .setDescription('Yêu cầu AI phân tích phong cách chat và phong danh hiệu mới'),
    ),

  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const targetUser = interaction.options.getUser('user') ?? interaction.user;
      const user = await services.repositories.users.findByDiscordId(targetUser.id);
      const titles = user?.titles || [];

      if (titles.length === 0) {
        await interaction.editReply(
          `👑 **${targetUser.username}** chưa có danh hiệu nào. Gõ \`/titles claim\` để AI phong danh hiệu độc quyền nhé!`,
        );
        return;
      }

      const lines = titles.map((t: any) => `${t.icon || '👑'} **${t.title}**\n> *${t.reason}*`);
      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle(`👑 Danh Hiệu AI Phong Tặng — ${targetUser.username}`)
        .setDescription(lines.join('\n\n'))
        .setFooter({ text: 'Dùng /titles claim để AI phân tích & phong thêm danh hiệu mới!' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'claim') {
      // Fetch recent messages of user from current channel for AI analysis
      const channel = interaction.channel;
      let sampleMessages: string[] = [];
      if (channel && channel.isTextBased() && !channel.isDMBased()) {
        try {
          const fetched = await channel.messages.fetch({ limit: 50 });
          sampleMessages = [...fetched.values()]
            .filter((m) => m.author.id === interaction.user.id && m.content.trim().length > 0)
            .map((m) => m.content);
        } catch (err) {
          // Ignore
        }
      }

      const title = await services.titles.generateTitleForUser(
        interaction.user.id,
        interaction.user.username,
        sampleMessages,
      );

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle(`🎉 PHONG DANH HIỆU MỚI!`)
        .setDescription(
          `Chúc mừng **${interaction.user.username}** vừa được AI Trọng Tài sắc phong Danh hiệu:\n\n` +
            `## ${title.icon} **${title.title}**\n` +
            `> *"${title.reason}"*`,
        )
        .setFooter({ text: 'Danh hiệu đã được ghi nhận vào hồ sơ cá nhân của bạn!' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
