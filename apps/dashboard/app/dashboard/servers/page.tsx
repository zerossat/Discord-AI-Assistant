import { getServerSession } from 'next-auth';
import type { GuildSummary } from '@daa/shared';
import { authOptions } from '@/lib/auth';
import { canManage } from '@/lib/admin';
import { getGuilds } from '@/lib/api';
import { ServerEditor } from '@/components/server-editor';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ServersPage() {
  const session = await getServerSession(authOptions);
  const editable = canManage(session?.user?.discordId);

  let guilds: GuildSummary[] = [];
  let error: string | null = null;
  try {
    guilds = (await getGuilds()).guilds;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Lỗi không xác định';
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Cấu hình Servers
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {editable
            ? 'Thay đổi mô hình AI, tiền tố lệnh, ngôn ngữ phản hồi và bật/tắt bộ nhớ cho từng máy chủ.'
            : 'Xem cấu hình chi tiết của từng máy chủ Discord (Chỉ xem).'}
        </p>
      </div>

      {error && (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-300">
          <CardContent className="p-6 text-sm">
            ⚠️ Đã xảy ra lỗi khi tải cấu hình: {error}
          </CardContent>
        </Card>
      )}

      {guilds.length === 0 && !error ? (
        <Card className="border-white/5 bg-white/[0.01]">
          <CardContent className="p-12 text-center text-sm text-slate-400">
            Bot chưa kết nối vào bất kỳ server nào.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {guilds.map((guild) => (
            <ServerEditor key={guild.guildId} guild={guild} editable={editable} />
          ))}
        </div>
      )}
    </div>
  );
}
