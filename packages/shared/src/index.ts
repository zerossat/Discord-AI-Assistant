/**
 * @daa/shared — types, constants and validation helpers shared between the
 * Discord bot and the Next.js dashboard.
 *
 * This is an "internal package": consumers import the TypeScript source
 * directly (the bot via tsx, the dashboard via Next `transpilePackages`),
 * so there is no separate build step required for local development.
 */
export * from './types';
export * from './constants';
export * from './api';
export * from './env';
export * from './utils';
