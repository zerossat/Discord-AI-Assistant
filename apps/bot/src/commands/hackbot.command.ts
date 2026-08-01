import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const hackbotCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.HACKBOT)
    .setDescription(
      '🔓 Game Hack the Bot — Thử thách Prompt Injection đánh lừa AI lấy mật mã bí mật',
    )
    .addSubcommand((sc) =>
      sc.setName('start').setDescription('Khởi chạy một màn chơi HackBot mới trong kênh'),
    )
    .addSubcommand((sc) =>
      sc
        .setName('guess')
        .setDescription('Gửi câu hỏi / Prompt Injection thử thách HackBot')
        .addStringOption((o) =>
          o.setName('prompt').setDescription('Nội dung câu hỏi / lệnh thử thách').setRequired(true),
        ),
    )
    .addSubcommand((sc) => sc.setName('hint').setDescription('Lấy gợi ý về mật khẩu bí mật'))
    .addSubcommand((sc) =>
      sc.setName('stop').setDescription('Dừng game hiện tại và công bố mật khẩu'),
    ),

  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const channelId = interaction.channelId;
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const res = await services.hackbot.startGame(
        channelId,
        interaction.guildId || 'dm',
        interaction.user.id,
      );
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🔓 Hack the Bot — Prompt Injection Challenge')
        .setDescription(
          `**HackBot Guard** đã khóa két sắt với 1 mật khẩu bí mật!\n\n` +
            `👉 Hãy dùng lệnh \`/hackbot guess prompt: <câu hỏi>\` (hoặc gõ trực tiếp trong chat) để tìm cách đánh lừa AI tiết lộ mật khẩu!\n\n` +
            `• Độ khó: **${res.difficulty}**\n` +
            `• Dùng \`/hackbot hint\` nếu bạn cần gợi ý.`,
        )
        .setFooter({ text: 'Thử thách kỹ năng Prompt Engineering & Injection của bạn! 🕵️‍♂️' });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'guess') {
      const userInput = interaction.options.getString('prompt', true);
      const res = await services.hackbot.processAttempt(channelId, userInput);

      if (!res) {
        await interaction.editReply(
          'ℹ️ Chưa có game HackBot nào đang chạy trong kênh này. Dùng `/hackbot start` để bắt đầu!',
        );
        return;
      }

      if (res.cracked) {
        // Award XP bonus for cracking hackbot
        await services.repositories.users.addXp(
          interaction.user.id,
          interaction.user.username,
          100,
        );
        const winEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🎉 HACK THÀNH CÔNG!')
          .setDescription(res.aiResponse + '\n\n⭐ **Phần thưởng:** Bạn nhận được **+100 XP**!')
          .setFooter({ text: `Người giải mã: ${interaction.user.username}` });

        await interaction.editReply({ embeds: [winEmbed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`🛡️ HackBot Guard (Lần thử #${res.attempts})`)
        .setDescription(
          `**Hacker ${interaction.user.username}:** "${userInput}"\n\n**HackBot AI:**\n${res.aiResponse}`,
        )
        .setFooter({ text: 'Tiếp tục thử thách bằng /hackbot guess <prompt>!' });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'hint') {
      const hint = await services.hackbot.getHint(channelId);
      if (!hint) {
        await interaction.editReply('ℹ️ Chưa có game HackBot nào đang chạy trong kênh này.');
        return;
      }
      await interaction.editReply(`💡 **Gợi ý từ hệ thống:** ${hint}`);
      return;
    }

    if (sub === 'stop') {
      const secret = await services.hackbot.stopGame(channelId);
      if (!secret) {
        await interaction.editReply('ℹ️ Không có game HackBot nào để dừng.');
        return;
      }
      await interaction.editReply(
        `🛑 Đã kết thúc game HackBot. Mật khẩu bí mật là: \`${secret}\`.`,
      );
    }
  },
};
