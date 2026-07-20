import { Events, type Client } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { leave } from '../utils/voice.manager';
import { childLogger } from '../utils/logger';

const log = childLogger('voice');

/**
 * Auto-leave: once the last human leaves the voice channel the bot is in,
 * disconnect. The bot otherwise stays after `/tts` finishes reading.
 */
export function registerVoiceStateUpdate(client: Client): void {
  client.on(Events.VoiceStateUpdate, (oldState) => {
    const { guild } = oldState;
    const connection = getVoiceConnection(guild.id);
    if (!connection) return;

    const channelId = connection.joinConfig.channelId;
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isVoiceBased()) return;

    const humans = channel.members.filter((m) => !m.user.bot).size;
    if (humans === 0) {
      log.info({ guildId: guild.id }, 'voice channel empty — leaving');
      leave(guild.id);
    }
  });
}
