import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import {
  QUIZ_PUZZLES,
  generateMaskedHint,
  removeVietnameseAccents,
  type QuizItem,
} from './quiz.data';

export interface ActiveQuizSession {
  puzzle: QuizItem;
  hintLevel: number;
  channelId: string;
  createdAt: number;
}

/** Store current active quiz per channelId */
const activeQuizzes = new Map<string, ActiveQuizSession>();

function getRandomPuzzle(excludeId?: number): QuizItem {
  const available = excludeId ? QUIZ_PUZZLES.filter((p) => p.id !== excludeId) : QUIZ_PUZZLES;
  const index = Math.floor(Math.random() * available.length);
  return available[index] ?? QUIZ_PUZZLES[0]!;
}

function buildQuizEmbed(session: ActiveQuizSession, statusMessage?: string): EmbedBuilder {
  const { puzzle, hintLevel } = session;
  const masked = generateMaskedHint(puzzle.answer, hintLevel);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧩 Game: Đuổi Hình Bắt Chữ')
    .setDescription(
      `### Hình gợi ý:\n# ${puzzle.question}\n\n` +
        `**Từ cần tìm:** \`${masked}\` (${puzzle.answer.length} ký tự)\n` +
        `**Chủ đề:** ${puzzle.category}\n` +
        (hintLevel >= 2 ? `\n💡 **Gợi ý chi tiết:** *${puzzle.hintText}*` : ''),
    )
    .setFooter({ text: 'Nhấn [💡 Gợi ý], [🎯 Trả lời] hoặc [⏭️ Câu khác] bên dưới' });

  if (statusMessage) {
    embed.addFields({ name: '📢 Thông báo', value: statusMessage });
  }

  return embed;
}

function buildQuizButtons(disableAll = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz:hint')
      .setLabel('💡 Gợi ý')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disableAll),
    new ButtonBuilder()
      .setCustomId('quiz:answer')
      .setLabel('🎯 Trả lời')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disableAll),
    new ButtonBuilder()
      .setCustomId('quiz:skip')
      .setLabel('⏭️ Câu khác')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disableAll),
  );
}

function buildNextButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz:next')
      .setLabel('▶️ Câu tiếp theo')
      .setStyle(ButtonStyle.Primary),
  );
}

export const quizCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.QUIZ)
    .setDescription('🧩 Trò chơi Đuổi Hình Bắt Chữ tương tác với gợi ý')
    .addStringOption((o) =>
      o.setName('dap-an').setDescription('Nhập đáp án bạn dự đoán').setRequired(false),
    ),

  async execute(interaction) {
    const channelId = interaction.channelId;
    const guessInput = interaction.options.getString('dap-an');
    let session = activeQuizzes.get(channelId);

    // Nếu người dùng nhập trực tiếp đáp án qua lệnh
    if (guessInput && session) {
      const userNorm = removeVietnameseAccents(guessInput);
      const targetNorm = session.puzzle.normalizedAnswer;

      if (userNorm === targetNorm) {
        activeQuizzes.delete(channelId);
        const member = interaction.member instanceof GuildMember ? interaction.member : null;
        const winnerName = member?.displayName ?? interaction.user.displayName;

        const winEmbed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('🎉 CHÚC MỪNG! BẠN ĐÃ TRẢ LỜI ĐÚNG!')
          .setDescription(
            `🏆 **${winnerName}** đã đoán chính xác đáp án: **${session.puzzle.answer}**!\n\n` +
              `🧩 Hình đố: ${session.puzzle.question}\n` +
              `💡 Giải nghĩa: ${session.puzzle.hintText}`,
          );

        await interaction.reply({ embeds: [winEmbed], components: [buildNextButton()] });
        return;
      } else {
        await interaction.reply({
          content: `❌ Đáp án \`${guessInput}\` chưa chính xác! Hãy thử lại hoặc bấm **[💡 Gợi ý]**.`,
          flags: 64, // Ephemeral
        });
        return;
      }
    }

    // Tạo câu đố mới nếu chưa có câu đố trong kênh
    if (!session) {
      const puzzle = getRandomPuzzle();
      session = { puzzle, hintLevel: 1, channelId, createdAt: Date.now() };
      activeQuizzes.set(channelId, session);
    }

    const embed = buildQuizEmbed(session);
    await interaction.reply({ embeds: [embed], components: [buildQuizButtons()] });
  },
};

/** Handler cho các Button & Modal tương tác của Quiz */
export async function handleQuizInteraction(
  interaction: ButtonInteraction | ModalSubmitInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  if (!channelId) return;

  const customId = interaction.customId;

  // 1. Modal mở để người dùng điền đáp án
  if (interaction.isButton() && customId === 'quiz:answer') {
    const modal = new ModalBuilder()
      .setCustomId('quiz:modal_answer')
      .setTitle('🧩 Trả lời Đuổi Hình Bắt Chữ');

    const answerInput = new TextInputBuilder()
      .setCustomId('quiz_user_answer')
      .setLabel('Đáp án của bạn là gì?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ví dụ: Bóng đá, Cầu vồng...')
      .setRequired(true)
      .setMaxLength(100);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(answerInput);
    modal.addComponents(row);
    await interaction.showModal(modal);
    return;
  }

  let session = activeQuizzes.get(channelId);

  // 2. Nút "▶️ Câu tiếp theo"
  if (interaction.isButton() && customId === 'quiz:next') {
    const puzzle = getRandomPuzzle(session?.puzzle.id);
    const newSession: ActiveQuizSession = { puzzle, hintLevel: 1, channelId, createdAt: Date.now() };
    activeQuizzes.set(channelId, newSession);

    const embed = buildQuizEmbed(newSession);
    await interaction.update({ embeds: [embed], components: [buildQuizButtons()] });
    return;
  }

  // Nếu chưa có session hiện tại, tạo mới
  if (!session) {
    const puzzle = getRandomPuzzle();
    session = { puzzle, hintLevel: 1, channelId, createdAt: Date.now() };
    activeQuizzes.set(channelId, session);
  }

  // 3. Nút "💡 Gợi ý"
  if (interaction.isButton() && customId === 'quiz:hint') {
    if (session.hintLevel < 3) {
      session.hintLevel += 1;
    }
    const embed = buildQuizEmbed(session, `💡 Đã mở thêm gợi ý (Cấp độ ${session.hintLevel}/3)!`);
    await interaction.update({ embeds: [embed], components: [buildQuizButtons()] });
    return;
  }

  // 4. Nút "⏭️ Bỏ qua / Câu khác"
  if (interaction.isButton() && customId === 'quiz:skip') {
    const oldAnswer = session.puzzle.answer;
    const newPuzzle = getRandomPuzzle(session.puzzle.id);
    const newSession: ActiveQuizSession = { puzzle: newPuzzle, hintLevel: 1, channelId, createdAt: Date.now() };
    activeQuizzes.set(channelId, newSession);

    const embed = buildQuizEmbed(newSession, `⏭️ Đã bỏ qua! Đáp án câu trước là: **${oldAnswer}**.`);
    await interaction.update({ embeds: [embed], components: [buildQuizButtons()] });
    return;
  }

  // 5. Xử lý khi nộp Modal đáp án
  if (interaction.isModalSubmit() && customId === 'quiz:modal_answer') {
    const userGuess = interaction.fields.getTextInputValue('quiz_user_answer').trim();
    const userNorm = removeVietnameseAccents(userGuess);
    const targetNorm = session.puzzle.normalizedAnswer;

    if (userNorm === targetNorm) {
      const currentPuzzle = session.puzzle;
      activeQuizzes.delete(channelId);
      const member = interaction.member instanceof GuildMember ? interaction.member : null;
      const winnerName = member?.displayName ?? interaction.user.displayName;

      const winEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('🎉 CHÚC MỪNG! BẠN ĐÃ TRẢ LỜI ĐÚNG!')
        .setDescription(
          `🏆 **${winnerName}** đã đoán chính xác đáp án: **${currentPuzzle.answer}**!\n\n` +
            `🧩 Hình đố: ${currentPuzzle.question}\n` +
            `💡 Giải nghĩa: ${currentPuzzle.hintText}`,
        );

      await interaction.reply({ embeds: [winEmbed], components: [buildNextButton()] });
    } else {
      await interaction.reply({
        content: `❌ Đáp án \`${userGuess}\` chưa chính xác! Hãy thử lại hoặc bấm **[💡 Gợi ý]**.`,
        flags: 64, // Ephemeral
      });
    }
  }
}
