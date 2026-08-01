import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const turingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.TURING)
    .setDescription('🌀 DỰ ÁN TURING — Game Ma Sói AI & Tòa Án Phán Xét 24/7')
    .addSubcommand((sc) => sc.setName('status').setDescription('Xem trạng thái vỏ bọc ngầm và điểm nghi vấn của Server'))
    .addSubcommand((sc) =>
      sc
        .setName('suspect')
        .setDescription('Gửi nghi vấn đối với một thành viên (Khi đủ 3 nghi vấn -> Mở Tòa Án Turing)')
        .addUserOption((o) => o.setName('user').setDescription('Thành viên nghi ngờ là Kẻ Trà Trộn AI').setRequired(true)),
    )
    .addSubcommand((sc) =>
      sc
        .setName('interrogate')
        .setDescription('Đặt câu hỏi tra hỏi nghi phạm trong Tòa Án Turing')
        .addStringOption((o) => o.setName('question').setDescription('Câu hỏi tra hỏi hóc múa').setRequired(true)),
    )
    .addSubcommand((sc) =>
      sc
        .setName('vote')
        .setDescription('Bỏ phiếu phán quyết nghi phạm là NGƯỜI THẬT hay KẺ TRÀ TRỘN AI')
        .addStringOption((o) =>
          o
            .setName('choice')
            .setDescription('Lựa chọn phán quyết của bạn')
            .setRequired(true)
            .addChoices(
              { name: '🧑 NGƯỜI THẬT (Human)', value: 'HUMAN' },
              { name: '🤖 KẺ TRÀ TRỘN AI (AI Chameleon)', value: 'AI' },
            ),
        ),
    )
    .addSubcommand((sc) => sc.setName('resolve').setDescription('Chốt phán quyết Tòa Án Turing và công bố kết quả'))
    .addSubcommand((sc) =>
      sc.setName('new-persona').setDescription('Khởi tạo vỏ bọc Chameleon AI hoàn toàn mới (Admin)'),
    ),

  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.editReply('Lệnh này chỉ sử dụng được trong Server.');
      return;
    }

    const sub = interaction.options.getSubcommand();
    const game = await services.turing.getOrInitGame(guildId);

    if (sub === 'status') {
      const statusText = game.status === 'court' ? '⚖️ ĐANG MỞ TÒA ÁN TURING!' : '🕵️ ĐANG THÂM NHẬP ÂM THẦM';
      const embed = new EmbedBuilder()
        .setColor(game.status === 'court' ? 0xe74c3c : 0x3498db)
        .setTitle('🌀 DỰ ÁN TURING — Trạng Thái Hệ Thống')
        .setDescription(`**Trạng thái:** ${statusText}\n\n**Chỉ số Nghi vấn (Paranoia Gauge):** ${game.suspicionCount} / 3 nghi vấn`)
        .addFields(
          { name: '🎭 Thân phận Chameleon ngầm', value: `\`${game.persona.name}\` — *"${game.persona.personality}"*` },
          { name: '👥 Thành viên đã nghi vấn', value: game.suspectedBy.length > 0 ? game.suspectedBy.map((id) => `<@${id}>`).join(', ') : 'Chưa có ai' },
          { name: '🗳️ Số phiếu đã vote trong Tòa Án', value: `${game.votes.length} phiếu` },
        )
        .setFooter({ text: 'Dùng /turing suspect <user> để gửi nghi vấn!' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'suspect') {
      const targetUser = interaction.options.getUser('user', true);
      const res = await services.turing.suspectUser(guildId, targetUser.id, targetUser.username, interaction.user.id);

      if (res.triggeredCourt) {
        const courtEmbed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('⚖️ TÒA ÁN TURING CHÍNH THỨC MỞ PHIÊN!')
          .setDescription(
            `🔥 Mức độ nghi vấn đối với **${targetUser.username}** đã đạt **3/3**!\n\n` +
              `**10 Phút Hỏi Xoáy Đáp Xoay:**\n` +
              `• Mọi người gõ \`/turing interrogate question: <câu hỏi>\` để liên tục tra hỏi nghi phạm.\n` +
              `• Dùng \`/turing vote choice: HUMAN | AI\` để bỏ phiếu phán quyết!\n` +
              `• Khi kết thúc, gõ \`/turing resolve\` để chốt kết quả!`,
          )
          .setFooter({ text: 'Hãy tra hỏi thật kỹ trước khi bỏ phiếu!' });

        await interaction.editReply({ embeds: [courtEmbed] });
        return;
      }

      await interaction.editReply(
        `🔍 **${interaction.user.username}** vừa gửi chỉ số nghi vấn đối với **${targetUser.username}**! (Hiện tại: ${res.game.suspicionCount}/3 nghi vấn).`,
      );
      return;
    }

    if (sub === 'interrogate') {
      const question = interaction.options.getString('question', true);
      const answer = await services.turing.respondToInterrogation(guildId, question, interaction.user.username);

      const embed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle('⚖️ Tòa Án Turing — Tra Hỏi Nghi Phạm')
        .setDescription(`**Thẩm phán ${interaction.user.username}:** "${question}"\n\n**Nghi phạm (${game.persona.name}):**\n${answer}`)
        .setFooter({ text: 'Dùng /turing vote để bầu chọn phán quyết cuối cùng!' });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'vote') {
      const choice = interaction.options.getString('choice', true) as 'HUMAN' | 'AI';
      const updatedGame = await services.turing.recordVote(guildId, interaction.user.id, interaction.user.username, choice);

      const choiceText = choice === 'HUMAN' ? '🧑 NGƯỜI THẬT' : '🤖 KẺ TRÀ TRỘN AI';
      await interaction.editReply(`🗳️ **${interaction.user.username}** đã bỏ phiếu phán quyết nghi phạm là **${choiceText}**! (Tổng: ${updatedGame.votes.length} lá phiếu).`);
      return;
    }

    if (sub === 'resolve') {
      const res = await services.turing.resolveCourt(guildId);
      const embed = new EmbedBuilder()
        .setColor(res.aiWon ? 0xe74c3c : 0x2ecc71)
        .setTitle('⚖️ PHÁN QUYẾT CUỐI CÙNG — TÒA ÁN TURING')
        .setDescription(res.summaryMessage)
        .addFields(
          { name: '✅ Người đoán đúng (+200 XP)', value: res.correctVoters.length > 0 ? res.correctVoters.join(', ') : 'Không có' },
          { name: '❌ Người đoán sai', value: res.wrongVoters.length > 0 ? res.wrongVoters.join(', ') : 'Không có' },
        )
        .setFooter({ text: 'Dự Án Turing · Bản sắc nghi vấn tiếp tục diễn ra!' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'new-persona') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.editReply('⚠️ Bạn cần có quyền **Manage Server** để dùng lệnh này.');
        return;
      }
      const newGame = await services.turing.generateNewPersona(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🎭 Đã Khởi Tạo Vỏ Bọc Chameleon AI Mới!')
        .setDescription(`**Thân phận ngầm:** \`${newGame.persona.name}\`\n**Phong cách:** *"${newGame.persona.personality}"*\n\nAI đã âm thầm trà trộn vào Server. Hãy chú ý các tin nhắn nghi vấn!`)
        .setFooter({ text: 'Dự Án Turing — Infiltration Started' });

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
