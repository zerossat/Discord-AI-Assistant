/**
 * Register slash commands with Discord.
 *
 *   pnpm --filter @daa/bot deploy:commands
 *
 * If DISCORD_DEV_GUILD_ID is set, commands are registered to that single guild
 * (instant). Otherwise they are registered globally (can take up to ~1 hour to
 * propagate the first time).
 */
import { REST, Routes } from 'discord.js';
import { env } from './config/env';
import { commands } from './commands';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  if (env.DISCORD_DEV_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID),
      { body },
    );
    logger.info(
      `✅ Registered ${body.length} guild command(s) to ${env.DISCORD_DEV_GUILD_ID}`,
    );
  } else {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
    logger.info(`✅ Registered ${body.length} global command(s)`);
  }
}

main().catch((err) => {
  logger.error({ err }, 'Failed to deploy commands');
  process.exit(1);
});
