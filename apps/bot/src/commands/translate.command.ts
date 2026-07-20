import { SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildChatContext } from '../utils/context';
import { sendChunked } from '../utils/reply';
import { LANGUAGE_CHOICES, SOURCE_LANGUAGE_CHOICES } from '../utils/choices';

export const translateCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.TRANSLATE)
    .setDescription('Dịch văn bản — Translate text')
    .addStringOption((option) =>
      option
        .setName('to')
        .setDescription('Ngôn ngữ đích / Target language')
        .setRequired(true)
        .addChoices(...LANGUAGE_CHOICES),
    )
    .addStringOption((option) =>
      option
        .setName('text')
        .setDescription('Văn bản cần dịch / Text to translate')
        .setRequired(true)
        .setMaxLength(2000),
    )
    .addStringOption((option) =>
      option
        .setName('from')
        .setDescription('Ngôn ngữ nguồn / Source language (default: auto-detect)')
        .addChoices(...SOURCE_LANGUAGE_CHOICES),
    ),
  async execute(interaction, services) {
    await interaction.deferReply();
    const to = interaction.options.getString('to', true);
    const text = interaction.options.getString('text', true);
    const from = interaction.options.getString('from') ?? 'auto';
    const ctx = await buildChatContext(interaction, services);
    const translated = await services.chat.translate(ctx, text, from, to);
    await sendChunked(interaction, translated);
  },
};
