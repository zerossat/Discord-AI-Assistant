'use server';

import { revalidatePath } from 'next/cache';
import type { UpdateGuildSettingsInput } from '@daa/shared';
import { getAuthSession } from '@/lib/auth';
import { canManage } from '@/lib/admin';
import { deleteConversation, patchGuild, resetUserMemory } from '@/lib/api';

async function ensureManager(): Promise<void> {
  const session = await getAuthSession();
  if (!session) throw new Error('Bạn cần đăng nhập.');
  if (!canManage(session.user?.discordId)) {
    throw new Error('Bạn không có quyền quản lý (chỉ admin).');
  }
}

export async function updateGuildAction(
  guildId: string,
  patch: UpdateGuildSettingsInput,
): Promise<void> {
  await ensureManager();
  await patchGuild(guildId, patch);
  revalidatePath('/dashboard/servers');
}

export async function resetUserMemoryAction(userId: string): Promise<void> {
  await ensureManager();
  await resetUserMemory(userId);
  revalidatePath('/dashboard/users');
}

export async function deleteConversationAction(userId: string, guildId: string): Promise<void> {
  await ensureManager();
  await deleteConversation(userId, guildId);
  revalidatePath('/dashboard/conversations');
}
