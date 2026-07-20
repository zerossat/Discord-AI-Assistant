import { SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES, DEFAULT_LANGUAGE } from '@daa/shared';
import type { Command } from './types';
import type { SummarySourceMessage } from '../ai/prompts';
import { sendChunked } from '../utils/reply';

export const summaryCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.SUMMARY)
    .setDescription('Tóm tắt tin nhắn gần đây trong kênh — Summarise recent channel messages')
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Số tin nhắn cần lấy (10–100, mặc định 100)')
        .setMinValue(10)
        .setMaxValue(100),
    ),
  async execute(interaction, services) {
    await interaction.deferReply();

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.editReply('Lệnh này chỉ dùng được trong kênh văn bản của server.');
      return;
    }

    const settings = interaction.guildId
      ? await services.repositories.settings.getOrCreate(interaction.guildId)
      : null;
    const limit = interaction.options.getInteger('limit') ?? settings?.summaryMessageLimit ?? 100;

    const fetched = await channel.messages.fetch({ limit: Math.min(limit, 100) });
    const source: SummarySourceMessage[] = [...fetched.values()]
      .reverse()
      .filter((m) => !m.author.bot && m.content.trim().length > 0)
      .map((m) => ({ author: m.author.username, content: m.content }));

    if (source.length === 0) {
      await interaction.editReply('Không tìm thấy tin nhắn nào để tóm tắt.');
      return;
    }

    const language = settings?.language ?? DEFAULT_LANGUAGE;
    const ctx = {
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId,
      model: settings?.aiModel,
    };
    const summary = await services.chat.summarize(ctx, source, language);
    await sendChunked(interaction, `📝 **Tóm tắt ${source.length} tin nhắn:**\n\n${summary}`);
  },
};
