import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import { env } from './config/env';
import { logger } from './utils/logger';
import { connectMongo, disconnectMongo } from './database/connection';
import { createServiceContainer } from './services';
import { createDiscordClient } from './discord/client';
import { registerInteractionCreate, registerReady, registerVoiceStateUpdate, registerMessageCreate } from './events';
import { createApp } from './server/app';

async function bootstrap(): Promise<void> {
  logger.info('🚀 Starting Discord AI Assistant…');

  // 1. Data stores
  try {
    await connectMongo(env.MONGODB_URI);
  } catch (err) {
    logger.warn({ err }, 'MongoDB connection failed — operating in memory/fallback mode');
  }
  const services = createServiceContainer();

  // 1b. Voice prerequisites for `/tts`: point the transcoder at the bundled
  // ffmpeg and pre-initialise the encryption backend (best-effort).
  try {
    const ffmpegPath = (await import('ffmpeg-static')).default;
    if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;
    const sodium = (await import('libsodium-wrappers')).default;
    await sodium.ready;
    logger.info('🔊 Voice backend ready (/tts enabled)');
  } catch (err) {
    logger.warn({ err }, 'Voice prerequisites not fully initialised — /tts may be unavailable');
  }

  // 2. Discord client + handlers
  const client = createDiscordClient();
  registerReady(client);
  registerInteractionCreate(client, services);
  registerVoiceStateUpdate(client);
  registerMessageCreate(client, services);

  // 2b. Auto-register slash commands with Discord API on startup (and clear duplicate guild commands)
  try {
    const { deploySlashCommands } = await import('./deploy-commands');
    await deploySlashCommands();
  } catch (err) {
    logger.warn({ err }, 'Failed to auto-register slash commands at startup');
  }

  // 3. HTTP API (dashboard + Swagger)
  const app = createApp(client, services);
  const server = app.listen(env.API_PORT, () => {
    logger.info(`🌐 API listening on http://localhost:${env.API_PORT} (docs at /api/docs)`);
  });

  // 4. Connect to Discord
  await client.login(env.DISCORD_TOKEN);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down…');
    server.close();
    await client.destroy();
    await services.redis.quit().catch(() => undefined);
    await disconnectMongo().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error during bootstrap');
  process.exit(1);
});
