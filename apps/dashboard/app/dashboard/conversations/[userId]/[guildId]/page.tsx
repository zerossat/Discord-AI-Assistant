import Link from 'next/link';
import type { Conversation } from '@daa/shared';
import { getConversation } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ userId: string; guildId: string }>;
}) {
  const { userId, guildId } = await params;

  let conversation: Conversation | null = null;
  let error: string | null = null;
  try {
    conversation = await getConversation(userId, guildId);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Lỗi không xác định';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chi tiết hội thoại</h1>
          <p className="text-muted-foreground">
            <code>{userId}</code> · {guildId === 'dm' ? 'DM' : `server ${guildId}`}
          </p>
        </div>
        <Link className="text-primary hover:underline" href="/dashboard/conversations">
          ← Quay lại
        </Link>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">⚠️ {error}</CardContent>
        </Card>
      )}

      {conversation && (
        <Card>
          <CardHeader>
            <CardTitle>{conversation.messages.length} tin nhắn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversation.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hội thoại trống.</p>
            ) : (
              conversation.messages.map((m, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="mb-1 text-xs uppercase text-muted-foreground">
                    {m.role === 'model' ? 'AI' : m.role}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
