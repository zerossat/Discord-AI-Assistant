/**
 * Register slash commands with Discord.
 *
 *   pnpm --filter @daa/bot deploy:commands
 *
 * If DISCORD_DEV_GUILD_ID is provided, commands are registered INSTANTLY
 * to that specific guild, as well as globally for all servers.
 */
import { REST, Routes } from 'discord.js';
import { env } from './config/env';
import { commands } from './commands';
import { logger } from './utils/logger';

export async function deploySlashCommands(): Promise<void> {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  // 1. Register commands instantly for dev guild if DISCORD_DEV_GUILD_ID is provided
  if (env.DISCORD_DEV_GUILD_ID) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID),
        { body },
      );
      logger.info(
        `⚡ Registered ${body.length} guild command(s) INSTANTLY to dev guild ${env.DISCORD_DEV_GUILD_ID}`,
      );
    } catch (err) {
      logger.warn({ err }, 'Failed to register guild commands');
    }
  }

  // 2. Register global commands for all servers
  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
  logger.info(`✅ Registered ${body.length} global slash command(s) for all servers.`);
}

deploySlashCommands().catch((err) => {
  logger.error({ err }, 'Failed to deploy commands');
  process.exit(1);
});
