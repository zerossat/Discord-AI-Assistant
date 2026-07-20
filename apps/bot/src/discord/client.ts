import { Client, GatewayIntentBits, Partials } from 'discord.js';

/**
 * Create the Discord gateway client.
 *
 * NOTE: `MessageContent` is a *privileged* intent required by `/summary`
 * (reading recent channel messages). Enable it in the Discord Developer
 * Portal → Bot → Privileged Gateway Intents.
 */
export function createDiscordClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel],
  });
}
