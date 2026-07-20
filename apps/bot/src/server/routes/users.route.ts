import { Router } from 'express';
import type { UserSummary } from '@daa/shared';
import type { ServiceContainer } from '../../services';
import { requireAuth } from '../middleware/auth';

export function usersRouter(services: ServiceContainer): Router {
  const router = Router();

  /**
   * @openapi
   * /api/users:
   *   get:
   *     summary: List users (most active first)
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Array of user summaries }
   */
  router.get('/users', requireAuth, async (_req, res) => {
    const users = await services.repositories.users.list(200);
    const payload: UserSummary[] = users.map((u) => ({
      discordId: u.discordId,
      username: u.username,
      totalTokens: u.totalTokens,
      language: u.preferences.language,
      memoryEnabled: u.preferences.memoryEnabled,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    res.json({ users: payload });
  });

  /**
   * @openapi
   * /api/users/{userId}/reset-memory:
   *   post:
   *     summary: Clear all conversation memory for a user
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Memory cleared }
   */
  router.post('/users/:userId/reset-memory', requireAuth, async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const contexts = await services.repositories.conversations.listByUser(userId);
    for (const ctx of contexts) {
      await services.memory.reset(userId, ctx.guildId);
    }
    res.json({ ok: true, cleared: contexts.length });
  });

  return router;
}
