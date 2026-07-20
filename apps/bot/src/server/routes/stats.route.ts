import { Router } from 'express';
import type { ServiceContainer } from '../../services';
import { requireAuth } from '../middleware/auth';

export function statsRouter(services: ServiceContainer): Router {
  const router = Router();

  /**
   * @openapi
   * /api/stats:
   *   get:
   *     summary: Aggregate usage statistics
   *     tags: [Stats]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Usage stats
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Stats'
   *       401:
   *         description: Unauthorized
   */
  router.get('/stats', requireAuth, async (_req, res) => {
    const stats = await services.stats.getStats();
    res.json(stats);
  });

  return router;
}
