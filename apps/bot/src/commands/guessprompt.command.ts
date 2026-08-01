import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const guesspromptCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.GUESS)
    .setDescription('🖼️ Game Đoán Prompt Ảnh AI — Nhìn ảnh AI tạo ra và đoán từ khóa bí mật')
    .addSubcommand((sc) =>
      sc.setName('start').setDescription('Khởi tạo hình ảnh AI mới và bắt đầu game đoán từ khóa'),
    )
    .addSubcommand((sc) =>
      sc
        .setName('guess')
        .setDescription('Đưa ra dự đoán từ khóa prompt')
        .addStringOption((o) =>
          o.setName('keyword').setDescription('Từ khóa bạn đoán').setRequired(true),
        ),
    )
    .addSubcommand((sc) => sc.setName('hint').setDescription('Lấy gợi ý từ khóa'))
    .addSubcommand((sc) =>
      sc.setName('stop').setDescription('Dừng game và công bố từ khóa bí mật'),
    ),

  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const channelId = interaction.channelId;
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const res = await services.guessprompt.startGame(
        channelId,
        interaction.guildId || 'dm',
        interaction.user.id,
      );
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🖼️ Game Đoán Prompt Ảnh AI')
        .setDescription(
          `AI vừa tạo ra 1 bức ảnh từ một từ khóa bí mật!\n\n` +
            `👉 Hãy gõ \`/guessprompt guess keyword: <từ đoán>\` (hoặc gõ trực tiếp trong chat) để đoán từ khóa gốc!\n\n` +
            `• Dùng \`/guessprompt hint\` để nhận gợi ý nếu thấy khó nhé.`,
        )
        .setImage(res.imageUrl)
        .setFooter({ text: 'Nhìn ảnh và đoán xem AI đã vẽ gì nào! 🎨' });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'guess') {
      const keyword = interaction.options.getString('keyword', true);
      const res = await services.guessprompt.processGuess(channelId, keyword);

      if (!res) {
        await interaction.editReply(
          'ℹ️ Chưa có game Đoán Prompt nào đang chạy trong kênh này. Dùng `/guessprompt start` để bắt đầu!',
        );
        return;
      }

      if (res.correct) {
        await services.repositories.users.addXp(interaction.user.id, interaction.user.username, 80);
        const winEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🎉 ĐOÁN ĐÚNG RỒI!')
          .setDescription(res.message + '\n\n⭐ **Phần thưởng:** Bạn nhận được **+80 XP**!')
          .setFooter({ text: `Người thắng cuộc: ${interaction.user.username}` });

        await interaction.editReply({ embeds: [winEmbed] });
        return;
      }

      await interaction.editReply(res.message);
      return;
    }

    if (sub === 'hint') {
      const hint = await services.guessprompt.getHint(channelId);
      if (!hint) {
        await interaction.editReply('ℹ️ Chưa có game Đoán Prompt nào trong kênh này.');
        return;
      }
      await interaction.editReply(`💡 **Gợi ý từ khóa:** ${hint}`);
      return;
    }

    if (sub === 'stop') {
      const secret = await services.guessprompt.stopGame(channelId);
      if (!secret) {
        await interaction.editReply('ℹ️ Không có game nào để dừng.');
        return;
      }
      await interaction.editReply(`🛑 Đã dừng game. Từ khóa bí mật là: **${secret}**.`);
    }
  },
};
