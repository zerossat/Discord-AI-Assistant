import { getServerSession } from 'next-auth';
import type { UserSummary } from '@daa/shared';
import { authOptions } from '@/lib/auth';
import { canManage } from '@/lib/admin';
import { getUsers } from '@/lib/api';
import { ResetMemoryButton } from '@/components/reset-memory-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { Users, Coins, Globe, Brain } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const editable = canManage(session?.user?.discordId);

  let users: UserSummary[] = [];
  let error: string | null = null;
  try {
    users = (await getUsers()).users;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Lỗi không xác định';
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Người dùng
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Theo dõi danh sách người dùng tương tác với Bot và lượng tài nguyên AI (Tokens) tiêu thụ.
        </p>
      </div>

      {error && (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-300">
          <CardContent className="p-6 text-sm">
            ⚠️ Lỗi khi lấy danh sách người dùng: {error}
          </CardContent>
        </Card>
      )}

      {/* Main Table Card */}
      <Card className="border-white/5 bg-white/[0.01]">
        <CardHeader className="border-b border-white/5 bg-white/[0.005] px-6 py-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white">Thành viên tương tác</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Tổng số người dùng đã lưu trữ trong database
            </CardDescription>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 py-1 px-3 text-xs font-semibold text-slate-300">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            {users.length} người dùng
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Chưa có dữ liệu người dùng nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-6 font-semibold">Tên người dùng</th>
                    <th className="py-3 px-4 font-semibold">Discord ID</th>
                    <th className="py-3 px-4 font-semibold">
                      <span className="flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-amber-400" />
                        Tokens đã dùng
                      </span>
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-indigo-400" />
                        Ngôn ngữ
                      </span>
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      <span className="flex items-center gap-1">
                        <Brain className="h-3.5 w-3.5 text-emerald-400" />
                        Bộ nhớ
                      </span>
                    </th>
                    {editable && <th className="py-3 px-6 font-semibold text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.discordId} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6 font-bold text-white">
                        {u.username}
                      </td>
                      <td className="py-4 px-4">
                        <code className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-xs text-slate-400 font-mono">
                          {u.discordId}
                        </code>
                      </td>
                      <td className="py-4 px-4 text-slate-200 font-bold">
                        {formatNumber(u.totalTokens)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center rounded bg-white/5 border border-white/5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                          {u.language}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {u.memoryEnabled ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                            Bật
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                            Tắt
                          </span>
                        )}
                      </td>
                      {editable && (
                        <td className="py-4 px-6 text-right">
                          <ResetMemoryButton userId={u.discordId} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
