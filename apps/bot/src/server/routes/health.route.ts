import { Router } from 'express';
import type { Client } from 'discord.js';
import { isMongoConnected } from '../../database/connection';
import type { ServiceContainer } from '../../services';

export function healthRouter(client: Client, services: ServiceContainer): Router {
  const router = Router();

  /**
   * @openapi
   * /api/health:
   *   get:
   *     summary: Health / readiness probe
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Service status across Mongo, Redis and Discord.
   */
  router.get('/health', async (_req, res) => {
    const redis = await services.cache.ping();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      mongo: isMongoConnected(),
      redis,
      discord: client.isReady(),
    });
  });

  return router;
}
