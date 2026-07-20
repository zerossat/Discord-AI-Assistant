import { z } from 'zod';

/** Aggregate statistics exposed by the bot API and rendered on the dashboard. */
export const statsResponseSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  totalConversations: z.number().int().nonnegative(),
  totalGuilds: z.number().int().nonnegative(),
  totalMessages: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  generatedAt: z.string(),
});
export type StatsResponse = z.infer<typeof statsResponseSchema>;

/** Summary of a guild the bot is a member of. */
export const guildSummarySchema = z.object({
  guildId: z.string(),
  name: z.string().nullable(),
  memberCount: z.number().int().nonnegative().nullable(),
  aiModel: z.string(),
  prefix: z.string(),
  memoryEnabled: z.boolean(),
  language: z.string(),
  summaryMessageLimit: z.number().int().nonnegative(),
});
export type GuildSummary = z.infer<typeof guildSummarySchema>;

export const guildListResponseSchema = z.object({
  guilds: z.array(guildSummarySchema),
});
export type GuildListResponse = z.infer<typeof guildListResponseSchema>;

/** Payload accepted by `PATCH /api/guilds/:id`. */
export const updateGuildSettingsSchema = z.object({
  aiModel: z.string().min(1).optional(),
  prefix: z.string().min(1).max(5).optional(),
  language: z.string().min(2).max(8).optional(),
  memoryEnabled: z.boolean().optional(),
  summaryMessageLimit: z.number().int().min(1).max(500).optional(),
});
export type UpdateGuildSettingsInput = z.infer<typeof updateGuildSettingsSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  mongo: z.boolean(),
  redis: z.boolean(),
  discord: z.boolean(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** A user row for the dashboard "Người dùng" table. */
export const userSummarySchema = z.object({
  discordId: z.string(),
  username: z.string(),
  totalTokens: z.number().int().nonnegative(),
  language: z.string(),
  memoryEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const userListResponseSchema = z.object({ users: z.array(userSummarySchema) });
export type UserListResponse = z.infer<typeof userListResponseSchema>;

/** A stored conversation row for the dashboard "Hội thoại" table. */
export const conversationSummarySchema = z.object({
  userId: z.string(),
  guildId: z.string().nullable(),
  messageCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
});
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;

export const conversationListResponseSchema = z.object({
  conversations: z.array(conversationSummarySchema),
});
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;

/** Live bot status for the dashboard "Trạng thái" page. */
export const botStatusResponseSchema = z.object({
  online: z.boolean(),
  uptimeSeconds: z.number().nonnegative(),
  wsPing: z.number(),
  guildCount: z.number().int().nonnegative(),
  commandCount: z.number().int().nonnegative(),
  mongo: z.boolean(),
  redis: z.boolean(),
  generatedAt: z.string(),
});
export type BotStatusResponse = z.infer<typeof botStatusResponseSchema>;
