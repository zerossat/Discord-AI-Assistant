/**
 * Register slash commands with Discord.
 *
 *   pnpm --filter @daa/bot deploy:commands
 *
 * Clears any duplicate guild-specific commands and registers a single set of
 * global commands across all servers.
 */
import { REST, Routes } from 'discord.js';
import { env } from './config/env';
import { commands } from './commands';
import { logger } from './utils/logger';

export async function deploySlashCommands(): Promise<void> {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  // 1. Clears duplicate guild commands if DISCORD_DEV_GUILD_ID is provided
  if (env.DISCORD_DEV_GUILD_ID) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID),
        { body: [] },
      );
      logger.info(
        `🧹 Cleared duplicate guild command(s) from dev guild ${env.DISCORD_DEV_GUILD_ID}`,
      );
    } catch (err) {
      logger.warn({ err }, 'Failed to clear guild commands');
    }
  }

  // 2. Register single set of global commands for all servers
  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
  logger.info(`✅ Registered ${body.length} global slash command(s) (no duplicates).`);
}

deploySlashCommands().catch((err) => {
  logger.error({ err }, 'Failed to deploy commands');
  process.exit(1);
});
