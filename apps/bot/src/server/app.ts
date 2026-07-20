import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Client } from 'discord.js';
import type { ServiceContainer } from '../services';
import { childLogger } from '../utils/logger';
import { swaggerSpec } from './swagger';
import { healthRouter } from './routes/health.route';
import { statsRouter } from './routes/stats.route';
import { guildsRouter } from './routes/guilds.route';
import { usersRouter } from './routes/users.route';
import { conversationsRouter } from './routes/conversations.route';
import { statusRouter } from './routes/status.route';

const log = childLogger('api');

/** Build the Express app that serves the dashboard API + Swagger docs. */
export function createApp(client: Client, services: ServiceContainer): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use((req, _res, next) => {
    log.debug({ method: req.method, url: req.url }, 'request');
    next();
  });

  app.use('/api', healthRouter(client, services));
  app.use('/api', statsRouter(services));
  app.use('/api', guildsRouter(client, services));
  app.use('/api', usersRouter(services));
  app.use('/api', conversationsRouter(services));
  app.use('/api', statusRouter(client, services));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    log.error({ err }, 'unhandled API error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
