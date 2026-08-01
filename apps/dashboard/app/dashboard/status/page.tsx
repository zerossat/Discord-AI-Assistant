import type { BotStatusResponse } from '@daa/shared';
import { getStatus } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Wifi,
  Server,
  Clock,
  Database,
  Zap,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d} ngày`);
  if (h) parts.push(`${h} giờ`);
  parts.push(`${m} phút`);
  return parts.join(' ');
}

function StatusLine({
  ok,
  label,
  desc,
  icon: Icon,
}: {
  ok: boolean;
  label: string;
  desc: string;
  icon: any;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.005] p-4 transition-all hover:bg-white/[0.015] hover:border-white/10">
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            'rounded-lg p-2.5 border',
            ok
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn('relative flex h-2.5 w-2.5', ok ? 'text-emerald-400' : 'text-rose-400')}
        >
          {ok && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2.5 w-2.5',
              ok ? 'bg-emerald-500' : 'bg-rose-500',
            )}
          ></span>
        </span>
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            ok ? 'text-emerald-400' : 'text-rose-400',
          )}
        >
          {ok ? 'Hoạt động' : 'Gặp sự cố'}
        </span>
      </div>
    </div>
  );
}

export default async function StatusPage() {
  let status: BotStatusResponse | null = null;
  let error: string | null = null;
  try {
    status = await getStatus();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Lỗi không xác định';
  }

  const allOperational = status && status.online && status.mongo && status.redis;

  // Ping coloring helper
  const getPingColor = (ping: number) => {
    if (ping < 50) return 'text-emerald-400';
    if (ping < 150) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Trạng thái hệ thống
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Theo dõi trực tiếp tình trạng kết nối cơ sở dữ liệu và thời gian hoạt động của Discord
          bot.
        </p>
      </div>

      {error && (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-300">
          <CardContent className="p-6 text-sm">
            ⚠️ Không thể kết nối với dịch vụ API giám sát: {error}
          </CardContent>
        </Card>
      )}

      {status && (
        <>
          {/* Status Operational Alert */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-5 shadow-sm transition-all duration-300',
              allOperational
                ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400'
                : 'border-rose-500/10 bg-rose-500/5 text-rose-400',
            )}
          >
            {allOperational ? (
              <ShieldCheck className="h-6 w-6 shrink-0" />
            ) : (
              <ShieldAlert className="h-6 w-6 shrink-0 animate-bounce" />
            )}
            <div>
              <p className="text-base font-bold text-white">
                {allOperational
                  ? 'Tất cả các dịch vụ đang hoạt động bình thường'
                  : 'Một số dịch vụ đang gặp sự cố'}
              </p>
              <p className="text-xs opacity-75 mt-0.5">
                {allOperational
                  ? 'Mọi kết nối dữ liệu và Discord Gateway hoạt động ổn định.'
                  : 'Vui lòng kiểm tra nhật ký kết nối của từng thành phần dịch vụ bên dưới.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-white/5 bg-white/[0.01]">
              <CardContent className="p-6 flex items-center gap-4">
                <div
                  className={cn(
                    'rounded-lg p-3 border',
                    status.online
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                  )}
                >
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Bot Discord
                  </div>
                  <div className="mt-0.5 text-2xl font-black text-white">
                    {status.online ? 'ONLINE' : 'OFFLINE'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-white/[0.01]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-lg p-3 border text-indigo-400 bg-indigo-500/10 border-indigo-500/20">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Uptime
                  </div>
                  <div className="mt-0.5 text-xl font-bold text-white truncate max-w-[170px]">
                    {formatUptime(status.uptimeSeconds)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-white/[0.01]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-lg p-3 border text-amber-400 bg-amber-500/10 border-amber-500/20">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Độ trễ (Ping)
                  </div>
                  <div className={cn('mt-0.5 text-2xl font-black', getPingColor(status.wsPing))}>
                    {status.wsPing} ms
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-white/[0.01]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-lg p-3 border text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Servers kết nối
                  </div>
                  <div className="mt-0.5 text-2xl font-black text-white">{status.guildCount}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Services Details */}
          <Card className="border-white/5 bg-white/[0.01]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Thành phần chi tiết</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Chi tiết tình trạng kết nối từng thành phần hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <StatusLine
                ok={status.online}
                label="Discord Gateway Connection"
                desc="Kết nối mạng kết nối máy chủ Discord thông qua websocket."
                icon={Activity}
              />
              <StatusLine
                ok={status.mongo}
                label="MongoDB Database Connection"
                desc="Lưu trữ cấu hình Guild và lịch sử hội thoại dài hạn."
                icon={Database}
              />
              <StatusLine
                ok={status.redis}
                label="Redis Cache Service Connection"
                desc="Lưu đệm (Caching) lịch sử tin nhắn trượt hỗ trợ bot phản hồi tức thì."
                icon={Zap}
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-4 mt-2 text-xs text-slate-400 gap-2">
                <div>
                  Số lệnh bot đã đăng ký:{' '}
                  <span className="font-bold text-white">{status.commandCount}</span>
                </div>
                <div>
                  Cập nhật cuối:{' '}
                  <span className="font-semibold text-slate-300">
                    {new Date(status.generatedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
