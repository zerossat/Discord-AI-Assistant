import 'server-only';
import jwt from 'jsonwebtoken';
import type {
  BotStatusResponse,
  Conversation,
  ConversationListResponse,
  GuildListResponse,
  StatsResponse,
  UpdateGuildSettingsInput,
  UserListResponse,
} from '@daa/shared';

const BOT_API_URL = process.env.BOT_API_URL ?? 'http://localhost:4000';

/** Mint a short-lived service token the bot API will accept (shared secret). */
function serviceToken(): string {
  const secret =
    process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'discord-ai-assistant-secret-key-2026';
  return jwt.sign({ sub: 'dashboard', role: 'admin' }, secret, { expiresIn: '5m' });
}

async function botApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BOT_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serviceToken()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    // Always reflect live data on the dashboard.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Bot API ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export function getStats(): Promise<StatsResponse> {
  return botApi<StatsResponse>('/api/stats');
}

export function getGuilds(): Promise<GuildListResponse> {
  return botApi<GuildListResponse>('/api/guilds');
}

export function getUsers(): Promise<UserListResponse> {
  return botApi<UserListResponse>('/api/users');
}

export function getConversations(): Promise<ConversationListResponse> {
  return botApi<ConversationListResponse>('/api/conversations');
}

export function getConversation(userId: string, guildId: string): Promise<Conversation> {
  return botApi<Conversation>(`/api/conversations/${userId}/${guildId}`);
}

export function getStatus(): Promise<BotStatusResponse> {
  return botApi<BotStatusResponse>('/api/status');
}

// --- Mutations (called from server actions only) ---

export function patchGuild(guildId: string, patch: UpdateGuildSettingsInput): Promise<unknown> {
  return botApi(`/api/guilds/${guildId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function resetUserMemory(userId: string): Promise<unknown> {
  return botApi(`/api/users/${userId}/reset-memory`, { method: 'POST' });
}

export function deleteConversation(userId: string, guildId: string): Promise<unknown> {
  return botApi(`/api/conversations/${userId}/${guildId}`, { method: 'DELETE' });
}
