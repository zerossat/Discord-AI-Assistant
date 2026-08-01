import { SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildChatContext } from '../utils/context';
import { sendChunked } from '../utils/reply';

export const askCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.ASK)
    .setDescription('Hỏi AI bất cứ điều gì (hỗ trợ đọc File đính kèm) — Ask the AI anything')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Câu hỏi của bạn / Your question')
        .setRequired(true)
        .setMaxLength(2000),
    )
    .addAttachmentOption((option) =>
      option
        .setName('file')
        .setDescription('Đính kèm file TXT, CSV, JSON, MD, Code, PDF để AI phân tích')
        .setRequired(false),
    ),
  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    const question = interaction.options.getString('question', true);
    const attachment = interaction.options.getAttachment('file');

    let fullPrompt = question;

    if (attachment) {
      try {
        const response = await fetch(attachment.url);
        if (response.ok) {
          const contentType = attachment.contentType || '';
          const fileName = attachment.name.toLowerCase();

          // Read text-based files
          if (
            contentType.startsWith('text/') ||
            contentType.includes('json') ||
            contentType.includes('csv') ||
            contentType.includes('xml') ||
            fileName.endsWith('.txt') ||
            fileName.endsWith('.md') ||
            fileName.endsWith('.json') ||
            fileName.endsWith('.csv') ||
            fileName.endsWith('.js') ||
            fileName.endsWith('.ts') ||
            fileName.endsWith('.py') ||
            fileName.endsWith('.html') ||
            fileName.endsWith('.css')
          ) {
            const fileText = await response.text();
            const truncatedText = fileText.slice(0, 15000); // Limit attachment to 15k chars
            fullPrompt = `[📄 Tập tin đính kèm: ${attachment.name}]\n\`\`\`\n${truncatedText}\n\`\`\`\n\n[Câu hỏi của người dùng]: ${question}`;
          } else if (fileName.endsWith('.pdf') || contentType.includes('pdf')) {
            const buffer = await response.arrayBuffer();
            const textDecoder = new TextDecoder('utf-8');
            const pdfRawText = textDecoder.decode(buffer).replace(/[^\x20-\x7E\x0A\x0D]/g, ' ');
            const truncatedPdf = pdfRawText.slice(0, 10000);
            fullPrompt = `[📄 Nội dung trích xuất từ PDF: ${attachment.name}]\n${truncatedPdf}\n\n[Câu hỏi của người dùng]: ${question}`;
          } else {
            fullPrompt = `[📄 Tập tin đính kèm: ${attachment.name} (${attachment.contentType})]\n\n[Câu hỏi]: ${question}`;
          }
        }
      } catch (err) {
        // If file fetch fails, proceed with question only
      }
    }

    const ctx = await buildChatContext(interaction, services);
    const answer = await services.chat.ask(ctx, fullPrompt);
    await sendChunked(interaction, answer);
  },
};
