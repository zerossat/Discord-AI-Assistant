import type { ChatInputCommandInteraction } from 'discord.js';
import type { ChatContext, ServiceContainer } from '../services';

/**
 * Build a `ChatContext` from an interaction, resolving the per-guild AI model
 * from settings and enriching with guild/channel/user display information.
 */
export async function buildChatContext(
  interaction: ChatInputCommandInteraction,
  services: ServiceContainer,
): Promise<ChatContext> {
  const guildId = interaction.guildId;
  let model: string | undefined;
  if (guildId) {
    const settings = await services.repositories.settings.getOrCreate(guildId);
    model = settings.aiModel;
  }
  return {
    userId: interaction.user.id,
    username: interaction.user.username,
    displayName:
      interaction.member && 'displayName' in interaction.member
        ? (interaction.member.displayName as string)
        : interaction.user.displayName,
    guildId,
    guildName: interaction.guild?.name ?? undefined,
    channelName:
      interaction.channel && 'name' in interaction.channel
        ? (interaction.channel.name as string)
        : undefined,
    model,
  };
}
