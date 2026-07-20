import type { StatsResponse } from '@daa/shared';
import type {
  ConversationRepository,
  SettingsRepository,
  UserRepository,
} from '../database/repositories';

/** Aggregates usage statistics for the dashboard and `/stats` command. */
export class StatsService {
  constructor(
    private readonly users: UserRepository,
    private readonly conversations: ConversationRepository,
    private readonly settings: SettingsRepository,
  ) {}

  async getStats(): Promise<StatsResponse> {
    const [totalUsers, totalConversations, totalGuilds, totalMessages, totalTokens] =
      await Promise.all([
        this.users.count(),
        this.conversations.countConversations(),
        this.settings.count(),
        this.conversations.countMessages(),
        this.users.sumTokens(),
      ]);

    return {
      totalUsers,
      totalConversations,
      totalGuilds,
      totalMessages,
      totalTokens,
      generatedAt: new Date().toISOString(),
    };
  }
}
