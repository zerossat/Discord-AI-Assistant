import { Router } from 'express';
import type { ServiceContainer } from '../../services';
import { requireAuth } from '../middleware/auth';

/** `dm` is the URL-safe sentinel for a null (non-guild) conversation. */
const DM = 'dm';
const decodeGuild = (g: string): string | null => (g === DM ? null : g);

export function conversationsRouter(services: ServiceContainer): Router {
  const router = Router();

  /**
   * @openapi
   * /api/conversations:
   *   get:
   *     summary: List stored conversations (most recent first)
   *     tags: [Conversations]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Array of conversation summaries }
   */
  router.get('/conversations', requireAuth, async (_req, res) => {
    const conversations = await services.repositories.conversations.list(200);
    res.json({ conversations });
  });

  /**
   * @openapi
   * /api/conversations/{userId}/{guildId}:
   *   get:
   *     summary: Get one conversation (use "dm" for DMs)
   *     tags: [Conversations]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: The conversation }
   *       404: { description: Not found }
   */
  router.get('/conversations/:userId/:guildId', requireAuth, async (req, res) => {
    const { userId, guildId } = req.params;
    if (!userId || !guildId) {
      res.status(400).json({ error: 'userId and guildId are required' });
      return;
    }
    const conversation = await services.repositories.conversations.get(userId, decodeGuild(guildId));
    if (!conversation) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(conversation);
  });

  /**
   * @openapi
   * /api/conversations/{userId}/{guildId}:
   *   delete:
   *     summary: Delete a conversation (use "dm" for DMs)
   *     tags: [Conversations]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Deleted }
   */
  router.delete('/conversations/:userId/:guildId', requireAuth, async (req, res) => {
    const { userId, guildId } = req.params;
    if (!userId || !guildId) {
      res.status(400).json({ error: 'userId and guildId are required' });
      return;
    }
    await services.memory.forget(userId, decodeGuild(guildId));
    res.json({ ok: true });
  });

  return router;
}
