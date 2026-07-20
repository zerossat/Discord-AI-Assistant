import mongoose from 'mongoose';
import { Router } from 'express';
import type { Client } from 'discord.js';
import type { BotStatusResponse } from '@daa/shared';
import type { ServiceContainer } from '../../services';
import { commands } from '../../commands';
import { requireAuth } from '../middleware/auth';

export function statusRouter(client: Client, services: ServiceContainer): Router {
  const router = Router();

  /**
   * @openapi
   * /api/status:
   *   get:
   *     summary: Live bot status (uptime, ping, store health)
   *     tags: [Status]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Status snapshot }
   */
  router.get('/status', requireAuth, async (_req, res) => {
    let redis = false;
    try {
      redis = (await services.redis.ping()) === 'PONG';
    } catch {
      redis = false;
    }
    const payload: BotStatusResponse = {
      online: client.isReady(),
      uptimeSeconds: Math.floor(process.uptime()),
      wsPing: Math.max(0, Math.round(client.ws.ping)),
      guildCount: client.guilds.cache.size,
      commandCount: commands.length,
      mongo: mongoose.connection.readyState === 1,
      redis,
      generatedAt: new Date().toISOString(),
    };
    res.json(payload);
  });

  return router;
}
