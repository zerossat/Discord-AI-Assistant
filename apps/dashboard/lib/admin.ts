import 'server-only';

/**
 * Discord IDs allowed to mutate data. If `ADMIN_IDS` is empty, anyone who is
 * logged in can manage (open mode); otherwise only the listed IDs can.
 */
export function adminIds(): string[] {
  return (process.env.ADMIN_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function canManage(discordId?: string | null): boolean {
  const ids = adminIds();
  if (ids.length === 0) return true;
  return !!discordId && ids.includes(discordId);
}
