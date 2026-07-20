import { SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildChatContext } from '../utils/context';
import { sendChunked } from '../utils/reply';

export const codeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.CODE)
    .setDescription('Sinh code + giải thích — Generate code with explanation')
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Mô tả thứ cần code / What to build')
        .setRequired(true)
        .setMaxLength(2000),
    ),
  async execute(interaction, services) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt', true);
    const ctx = await buildChatContext(interaction, services);
    const answer = await services.chat.code(ctx, prompt);
    await sendChunked(interaction, answer);
  },
};
