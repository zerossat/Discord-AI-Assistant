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
  type ChatInputCommandInteraction,
  type Message,
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
        (hintLevel >= 2 ? `\n💡 **Gợi ý chi tiết:** *${puzzle.hintText}*` : '') +
        `\n\n👉 *Bạn có thể gõ đáp án trực tiếp vào kênh chat hoặc dùng nút bấm bên dưới!*`,
    )
    .setFooter({ text: 'Dùng /quiz start | /quiz hint | /quiz answer hoặc nút bấm' });

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

/** Helper an toàn cho việc phản hồi Slash Command */
async function sendSafeReply(
  interaction: ChatInputCommandInteraction,
  payload: any,
): Promise<void> {
  // Loại bỏ flag 64 nếu đã deferred để tránh lỗi DiscordAPIError 50035
  if (interaction.deferred || interaction.replied) {
    const { flags, ...cleanPayload } = payload;
    await interaction.editReply(cleanPayload);
  } else {
    await interaction.reply(payload);
  }
}

export const quizCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.QUIZ)
    .setDescription('🧩 Trò chơi Đuổi Hình Bắt Chữ tương tác với gợi ý')
    .addSubcommand((sub) =>
      sub.setName('start').setDescription('🎮 Bắt đầu một lượt chơi Đuổi Hình Bắt Chữ mới'),
    )
    .addSubcommand((sub) =>
      sub.setName('hint').setDescription('💡 Mở thêm gợi ý cho câu đố hiện tại'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('answer')
        .setDescription('🎯 Trả lời đáp án cho câu đố hiện tại')
        .addStringOption((o) =>
          o.setName('dap-an').setDescription('Nhập đáp án bạn dự đoán').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('skip').setDescription('⏭️ Bỏ qua câu đố hiện tại và xem đáp án'),
    ),

  async execute(interaction) {
    const channelId = interaction.channelId;
    let subcommand: string | null = null;
    try {
      subcommand = interaction.options.getSubcommand(false);
    } catch {
      subcommand = 'start';
    }
    if (!subcommand) subcommand = 'start';

    let session = activeQuizzes.get(channelId);

    // 1. /quiz start (hoặc fallback) -> Bắt đầu lượt chơi mới
    if (subcommand === 'start' || !['hint', 'skip', 'answer'].includes(subcommand)) {
      const puzzle = getRandomPuzzle(session?.puzzle.id);
      session = { puzzle, hintLevel: 1, channelId, createdAt: Date.now() };
      activeQuizzes.set(channelId, session);

      const embed = buildQuizEmbed(session, '🎮 Lượt chơi mới đã bắt đầu!');
      await sendSafeReply(interaction, { embeds: [embed], components: [buildQuizButtons()] });
      return;
    }

    // 2. /quiz hint -> Mở gợi ý
    if (subcommand === 'hint') {
      if (!session) {
        const puzzle = getRandomPuzzle();
        session = { puzzle, hintLevel: 1, channelId, createdAt: Date.now() };
        activeQuizzes.set(channelId, session);
      } else if (session.hintLevel < 3) {
        session.hintLevel += 1;
      }
      const embed = buildQuizEmbed(session, `💡 Đã mở thêm gợi ý (Cấp độ ${session.hintLevel}/3)!`);
      await sendSafeReply(interaction, { embeds: [embed], components: [buildQuizButtons()] });
      return;
    }

    // 3. /quiz skip -> Bỏ qua
    if (subcommand === 'skip') {
      if (!session) {
        const puzzle = getRandomPuzzle();
        session = { puzzle, hintLevel: 1, channelId, createdAt: Date.now() };
        activeQuizzes.set(channelId, session);
        const embed = buildQuizEmbed(session);
        await sendSafeReply(interaction, { embeds: [embed], components: [buildQuizButtons()] });
        return;
      }
      const oldAnswer = session.puzzle.answer;
      const newPuzzle = getRandomPuzzle(session.puzzle.id);
      session = { puzzle: newPuzzle, hintLevel: 1, channelId, createdAt: Date.now() };
      activeQuizzes.set(channelId, session);

      const embed = buildQuizEmbed(session, `⏭️ Đã bỏ qua! Đáp án câu trước là: **${oldAnswer}**.`);
      await sendSafeReply(interaction, { embeds: [embed], components: [buildQuizButtons()] });
      return;
    }

    // 4. /quiz answer -> Trả lời đáp án
    if (subcommand === 'answer') {
      let guessInput: string | null = null;
      try {
        guessInput = interaction.options.getString('dap-an');
      } catch {
        guessInput = null;
      }

      if (!session) {
        await sendSafeReply(interaction, {
          content: '❌ Chưa có câu đố nào đang diễn ra. Hãy gõ `/quiz start` để bắt đầu!',
        });
        return;
      }

      if (!guessInput) {
        await sendSafeReply(interaction, {
          content: '❌ Vui lòng nhập đáp án của bạn.',
        });
        return;
      }

      const userNorm = removeVietnameseAccents(guessInput);
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

        await sendSafeReply(interaction, { embeds: [winEmbed], components: [buildNextButton()] });
        return;
      } else {
        await sendSafeReply(interaction, {
          content: `❌ Đáp án \`${guessInput}\` chưa chính xác! Hãy thử lại hoặc bấm **[💡 Gợi ý]**.`,
        });
        return;
      }
    }
  },
};

/** Kiểm tra tin nhắn chat trực tiếp có phải là đáp án đúng không */
export async function checkQuizChatMessage(message: Message): Promise<boolean> {
  const channelId = message.channelId;
  const session = activeQuizzes.get(channelId);
  if (!session) return false;

  const userGuess = message.content.trim();
  const userNorm = removeVietnameseAccents(userGuess);
  if (!userNorm || userNorm.length < 2) return false;

  if (userNorm === session.puzzle.normalizedAnswer) {
    const currentPuzzle = session.puzzle;
    activeQuizzes.delete(channelId);

    const member = message.member instanceof GuildMember ? message.member : null;
    const winnerName = member?.displayName ?? message.author.displayName ?? message.author.username;

    const winEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🎉 CHÚC MỪNG! BẠN ĐÃ TRẢ LỜI ĐÚNG!')
      .setDescription(
        `🏆 **${winnerName}** đã đoán chính xác đáp án: **${currentPuzzle.answer}**!\n\n` +
          `🧩 Hình đố: ${currentPuzzle.question}\n` +
          `💡 Giải nghĩa: ${currentPuzzle.hintText}`,
      );

    await message.reply({ embeds: [winEmbed], components: [buildNextButton()] });
    return true;
  }

  return false;
}

/** Handler cho các Button & Modal tương tác của Quiz */
export async function handleQuizInteraction(
  interaction: ButtonInteraction | ModalSubmitInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  if (!channelId) return;

  const customId = interaction.customId;

  // Helper an toàn cho button update
  const sendSafeUpdate = async (payload: any) => {
    if (interaction.isButton()) {
      if (interaction.deferred || interaction.replied) {
        const { flags, ...cleanPayload } = payload;
        await interaction.editReply(cleanPayload);
      } else {
        await interaction.update(payload);
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.deferred || interaction.replied) {
        const { flags, ...cleanPayload } = payload;
        await interaction.editReply(cleanPayload);
      } else {
        await interaction.reply(payload);
      }
    }
  };

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
    await sendSafeUpdate({ embeds: [embed], components: [buildQuizButtons()] });
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
    await sendSafeUpdate({ embeds: [embed], components: [buildQuizButtons()] });
    return;
  }

  // 4. Nút "⏭️ Bỏ qua / Câu khác"
  if (interaction.isButton() && customId === 'quiz:skip') {
    const oldAnswer = session.puzzle.answer;
    const newPuzzle = getRandomPuzzle(session.puzzle.id);
    const newSession: ActiveQuizSession = { puzzle: newPuzzle, hintLevel: 1, channelId, createdAt: Date.now() };
    activeQuizzes.set(channelId, session);

    const embed = buildQuizEmbed(session, `⏭️ Đã bỏ qua! Đáp án câu trước là: **${oldAnswer}**.`);
    await sendSafeUpdate({ embeds: [embed], components: [buildQuizButtons()] });
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

      await sendSafeUpdate({ embeds: [winEmbed], components: [buildNextButton()] });
    } else {
      await sendSafeUpdate({
        content: `❌ Đáp án \`${userGuess}\` chưa chính xác! Hãy thử lại hoặc bấm **[💡 Gợi ý]**.`,
      });
    }
  }
}
