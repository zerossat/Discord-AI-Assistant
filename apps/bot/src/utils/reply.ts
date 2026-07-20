import { chunkMessage } from '@daa/shared';
import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Edit the (already-deferred) reply with `content`, splitting into multiple
 * messages when it exceeds Discord's 2000-character limit.
 */
export async function sendChunked(
  interaction: ChatInputCommandInteraction,
  content: string,
): Promise<void> {
  const chunks = chunkMessage(content.trim().length > 0 ? content : '*(empty response)*');
  await interaction.editReply(chunks[0]!);
  for (let i = 1; i < chunks.length; i++) {
    await interaction.followUp({ content: chunks[i]! });
  }
}
