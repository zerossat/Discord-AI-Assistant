import { SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildChatContext } from '../utils/context';
import { sendChunked } from '../utils/reply';

export const askCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.ASK)
    .setDescription('Hỏi AI bất cứ điều gì — Ask the AI anything')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Câu hỏi của bạn / Your question')
        .setRequired(true)
        .setMaxLength(2000),
    ),
  async execute(interaction, services) {
    await interaction.deferReply();
    const question = interaction.options.getString('question', true);
    const ctx = await buildChatContext(interaction, services);
    const answer = await services.chat.ask(ctx, question);
    await sendChunked(interaction, answer);
  },
};
