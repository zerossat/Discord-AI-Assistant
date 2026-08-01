import {
  Coins,
  Hash,
  MessagesSquare,
  Server,
  Users,
  ArrowRight,
  ExternalLink,
  Settings,
  Activity,
} from 'lucide-react';
import type { GuildSummary, StatsResponse } from '@daa/shared';
import { getGuilds, getStats } from '@/lib/api';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let stats: StatsResponse | null = null;
  let guilds: GuildSummary[] = [];
  let error: string | null = null;

  try {
    const [s, g] = await Promise.all([getStats(), getGuilds()]);
    stats = s;
    guilds = g.guilds;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  // Helper for model badge styles
  const getModelBadge = (model: string) => {
    if (model.includes('2.5-flash')) {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
    if (model.includes('pro')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi chi tiết số liệu hoạt động và quản lý cấu hình các Guild đang kết nối.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            id="quick-invite-btn"
            href="/invite"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/95 hover:scale-[1.02]"
          >
            Mời Bot Mới
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-300">
          <CardContent className="p-6 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold">Không lấy được dữ liệu từ Bot API</p>
              <p className="mt-1 text-xs opacity-80">
                Chi tiết lỗi: {error}. Hãy đảm bảo bot Discord đang khởi chạy và các biến{' '}
                <code>BOT_API_URL</code> / <code>JWT_SECRET</code> được định cấu hình chính xác.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Người dùng" value={stats.totalUsers} icon={Users} />
          <StatCard label="Hội thoại" value={stats.totalConversations} icon={MessagesSquare} />
          <StatCard label="Servers" value={stats.totalGuilds} icon={Server} />
          <StatCard label="Tin nhắn" value={stats.totalMessages} icon={Hash} />
          <StatCard label="AI Tokens" value={stats.totalTokens} icon={Coins} />
        </div>
      )}

      {/* Main Grid: Servers + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Servers Table Card */}
        <Card className="lg:col-span-2 border-white/5 bg-white/[0.01]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Danh sách Servers</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Các máy chủ Discord bot đang tham gia hoạt động
            </CardDescription>
          </CardHeader>
          <CardContent>
            {guilds.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Chưa có server nào kết nối.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-4 font-semibold">Tên Server</th>
                      <th className="pb-3 pr-4 font-semibold">Thành viên</th>
                      <th className="pb-3 pr-4 font-semibold">Mô hình AI</th>
                      <th className="pb-3 pr-4 font-semibold">Ký tự Lệnh</th>
                      <th className="pb-3 font-semibold text-right">Bộ nhớ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {guilds.map((g) => (
                      <tr key={g.guildId} className="group hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-white max-w-[180px] truncate">
                          {g.name ?? g.guildId}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-300 font-medium">
                          {g.memberCount != null ? formatNumber(g.memberCount) : '—'}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide ${getModelBadge(g.aiModel)}`}
                          >
                            {g.aiModel}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <code className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-xs font-semibold text-slate-300">
                            {g.prefix}
                          </code>
                        </td>
                        <td className="py-3.5 text-right">
                          {g.memoryEnabled ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                              Bật
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                              Tắt
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <div className="space-y-6">
          <Card className="border-white/5 bg-white/[0.01]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Thao tác nhanh</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Phím tắt quản trị hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link
                id="qa-config"
                href="/dashboard/servers"
                className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:bg-white/[0.03] hover:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/25 p-2 text-indigo-400 group-hover:scale-105 transition-transform">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Cấu hình Bot</p>
                    <p className="text-xs text-slate-400">Điều chỉnh model, prefix, bộ nhớ</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                id="qa-status"
                href="/dashboard/status"
                className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:bg-white/[0.03] hover:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-2 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Trạng thái hệ thống</p>
                    <p className="text-xs text-slate-400">Kiểm tra kết nối Mongo, Redis, Ping</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
