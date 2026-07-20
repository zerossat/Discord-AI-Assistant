/**
 * Idempotent database seed. Run with: `pnpm seed` (or `pnpm --filter @daa/bot seed`).
 * Inserts a couple of demo users, a guild settings doc and a sample conversation
 * so the dashboard has something to render before the bot is live.
 */
import { DEFAULT_AI_MODEL } from '@daa/shared';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { connectMongo, disconnectMongo } from './connection';
import { UserModel } from './models/user.model';
import { SettingsModel } from './models/settings.model';
import { ConversationModel } from './models/conversation.model';

const DEMO_USER_ID = '100000000000000001';
const DEMO_USER_2_ID = '100000000000000002';
const DEMO_GUILD_ID = '900000000000000001';

async function seed(): Promise<void> {
  await connectMongo(env.MONGODB_URI);
  logger.info('Seeding database…');

  await UserModel.updateOne(
    { discordId: DEMO_USER_ID },
    {
      $set: {
        username: 'demo_user',
        preferences: { language: 'vi', defaultTranslateTo: 'en', memoryEnabled: true },
        totalTokens: 1280,
      },
    },
    { upsert: true },
  );

  await UserModel.updateOne(
    { discordId: DEMO_USER_2_ID },
    { $set: { username: 'alice', totalTokens: 540 } },
    { upsert: true },
  );

  await SettingsModel.updateOne(
    { guildId: DEMO_GUILD_ID },
    {
      $set: {
        aiModel: DEFAULT_AI_MODEL,
        prefix: '!',
        language: 'vi',
        memoryEnabled: true,
        summaryMessageLimit: 100,
      },
    },
    { upsert: true },
  );

  await ConversationModel.updateOne(
    { userId: DEMO_USER_ID, guildId: DEMO_GUILD_ID },
    {
      $set: {
        messages: [
          { role: 'user', content: 'Docker là gì?', tokens: 8, createdAt: new Date() },
          {
            role: 'model',
            content:
              'Docker là nền tảng giúp đóng gói ứng dụng cùng dependencies vào container, chạy nhất quán trên mọi môi trường.',
            tokens: 48,
            createdAt: new Date(),
          },
        ],
      },
    },
    { upsert: true },
  );

  const [users, settings, conversations] = await Promise.all([
    UserModel.countDocuments(),
    SettingsModel.countDocuments(),
    ConversationModel.countDocuments(),
  ]);

  logger.info({ users, settings, conversations }, 'Seed complete ✅');
  await disconnectMongo();
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
