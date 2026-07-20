import { Router } from 'express';
import type { Client } from 'discord.js';
import {
  DEFAULT_AI_MODEL,
  DEFAULT_LANGUAGE,
  DEFAULT_PREFIX,
  DEFAULT_SUMMARY_MESSAGE_LIMIT,
  updateGuildSettingsSchema,
  type GuildSummary,
} from '@daa/shared';
import type { ServiceContainer } from '../../services';
import { requireAuth } from '../middleware/auth';

export function guildsRouter(client: Client, services: ServiceContainer): Router {
  const router = Router();

  /**
   * @openapi
   * /api/guilds:
   *   get:
   *     summary: List guilds the bot is in (joined with stored settings)
   *     tags: [Guilds]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Array of guild summaries
   */
  router.get('/guilds', requireAuth, async (_req, res) => {
    const settingsList = await services.repositories.settings.list();
    const byGuild = new Map(settingsList.map((s) => [s.guildId, s]));

    const guilds: GuildSummary[] = client.guilds.cache.map((g) => {
      const settings = byGuild.get(g.id);
      return {
        guildId: g.id,
        name: g.name,
        memberCount: g.memberCount ?? null,
        aiModel: settings?.aiModel ?? DEFAULT_AI_MODEL,
        prefix: settings?.prefix ?? DEFAULT_PREFIX,
        memoryEnabled: settings?.memoryEnabled ?? true,
        language: settings?.language ?? DEFAULT_LANGUAGE,
        summaryMessageLimit: settings?.summaryMessageLimit ?? DEFAULT_SUMMARY_MESSAGE_LIMIT,
      };
    });

    res.json({ guilds });
  });

  /**
   * @openapi
   * /api/guilds/{guildId}:
   *   patch:
   *     summary: Update settings for a guild
   *     tags: [Guilds]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: guildId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Updated settings }
   *       400: { description: Invalid body }
   *       401: { description: Unauthorized }
   */
  router.patch('/guilds/:guildId', requireAuth, async (req, res) => {
    const { guildId } = req.params;
    if (!guildId) {
      res.status(400).json({ error: 'guildId is required' });
      return;
    }
    const parsed = updateGuildSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
      return;
    }
    const updated = await services.repositories.settings.update(guildId, parsed.data);
    res.json(updated);
  });

  return router;
}
