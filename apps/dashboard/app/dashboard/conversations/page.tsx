import Link from 'next/link';
import type { ConversationSummary } from '@daa/shared';
import { getAuthSession } from '@/lib/auth';
import { canManage } from '@/lib/admin';
import { getConversations } from '@/lib/api';
import { DeleteConversationButton } from '@/components/delete-conversation-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Server, MessageCircle, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

const guildKey = (guildId: string | null): string => guildId ?? 'dm';

export default async function ConversationsPage() {
  const session = await getAuthSession();
  const editable = canManage(session?.user?.discordId);

  let conversations: ConversationSummary[] = [];
  let error: string | null = null;
  try {
    conversations = (await getConversations()).conversations;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Lỗi không xác định';
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Hội thoại
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Lịch sử trò chuyện chi tiết giữa người dùng và Bot thông qua Server hoặc kênh chat riêng
          (DM).
        </p>
      </div>

      {error && (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-300">
          <CardContent className="p-6 text-sm">
            ⚠️ Lỗi khi tải danh sách hội thoại: {error}
          </CardContent>
        </Card>
      )}

      {/* Conversations List Card */}
      <Card className="border-white/5 bg-white/[0.01]">
        <CardHeader className="border-b border-white/5 bg-white/[0.005] px-6 py-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white">Nhật ký hội thoại</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Danh sách các phiên hội thoại đang hoạt động
            </CardDescription>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 py-1 px-3 text-xs font-semibold text-slate-300">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            {conversations.length} hội thoại
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {conversations.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Chưa lưu trữ bất kỳ phiên hội thoại nào.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-6 font-semibold">User ID</th>
                    <th className="py-3 px-4 font-semibold">Kênh liên kết</th>
                    <th className="py-3 px-4 font-semibold">Số tin nhắn</th>
                    <th className="py-3 px-4 font-semibold">Cập nhật lần cuối</th>
                    <th className="py-3 px-6 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {conversations.map((c) => {
                    const key = guildKey(c.guildId);
                    const isDM = !c.guildId || c.guildId === 'dm';
                    return (
                      <tr
                        key={`${c.userId}:${key}`}
                        className="group hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <code className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-xs text-slate-400 font-mono">
                            {c.userId}
                          </code>
                        </td>
                        <td className="py-4 px-4 font-semibold">
                          {isDM ? (
                            <span className="inline-flex items-center gap-1.5 text-sky-400 text-xs">
                              <MessageCircle className="h-3.5 w-3.5" />
                              Chat riêng (DM)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-indigo-400 text-xs">
                              <Server className="h-3.5 w-3.5" />
                              Server: {c.guildId}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {c.messageCount} tin nhắn
                        </td>
                        <td className="py-4 px-4 text-slate-400">
                          {new Date(c.updatedAt).toLocaleString('vi-VN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Link
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                              href={`/dashboard/conversations/${c.userId}/${key}`}
                            >
                              <Eye className="h-3 w-3" />
                              Xem
                            </Link>
                            {editable && (
                              <DeleteConversationButton userId={c.userId} guildId={key} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
