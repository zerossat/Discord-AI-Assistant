import { ActivityType, Events, type Client } from 'discord.js';
import { logger } from '../utils/logger';

export function registerReady(client: Client): void {
  client.once(Events.ClientReady, (ready) => {
    logger.info(`🤖 Logged in as ${ready.user.tag} — serving ${ready.guilds.cache.size} guild(s)`);
    ready.user.setPresence({
      activities: [{ name: '/ask • Gemini AI', type: ActivityType.Listening }],
      status: 'online',
    });
  });
}
