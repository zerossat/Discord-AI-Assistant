import { pino, type Logger } from 'pino';

/**
 * Application logger. Reads LOG_LEVEL / NODE_ENV straight from `process.env`
 * (rather than the validated `env` module) so it carries no heavy import
 * graph and can be used safely from anywhere, including early bootstrap.
 */
const level = process.env.LOG_LEVEL ?? 'info';
const isProd = process.env.NODE_ENV === 'production';

export const logger: Logger = pino({
  level,
  // Pretty, colourised output in dev; raw JSON (better for log shippers) in prod.
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});

export type { Logger };

export const childLogger = (module: string): Logger => logger.child({ module });
