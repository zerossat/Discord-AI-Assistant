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

  // 1. Instantiate core service container
  const services = createServiceContainer();

  // 2. Initialize Discord client & register event handlers
  const client = createDiscordClient();
  registerReady(client);
  registerInteractionCreate(client, services);
  registerVoiceStateUpdate(client);
  registerMessageCreate(client, services);

  // 3. Connect to Discord Gateway IMMEDIATELY (<500ms) so slash commands work instantly
  try {
    if (!env.DISCORD_TOKEN) {
      logger.error('❌ DISCORD_TOKEN is missing! Please set DISCORD_TOKEN in Railway Variables.');
    } else {
      await client.login(env.DISCORD_TOKEN);
    }
  } catch (err) {
    logger.error({ err }, '❌ Failed to log into Discord! Please check DISCORD_TOKEN in Railway Variables.');
  }

  // 4. Connect to MongoDB in background without blocking Discord readiness
  connectMongo(env.MONGODB_URI).catch((err) => {
    logger.warn({ err }, 'MongoDB connection failed — operating in memory/fallback mode');
  });

  // 5. Voice prerequisites for `/tts` (best-effort background load)
  try {
    const ffmpegPath = (await import('ffmpeg-static')).default;
    if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;
    const sodium = (await import('libsodium-wrappers')).default;
    await sodium.ready;
    logger.info('🔊 Voice backend ready (/tts enabled)');
  } catch (err) {
    logger.warn({ err }, 'Voice prerequisites not fully initialised — /tts may be unavailable');
  }

  // 6. HTTP API (dashboard + Swagger + Railway Health Check)
  const app = createApp(client, services);
  const server = app.listen(env.API_PORT, '0.0.0.0', () => {
    logger.info(`🌐 API listening on http://0.0.0.0:${env.API_PORT} (docs at /api/docs)`);
  });

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
