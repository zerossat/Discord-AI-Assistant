'use client';

import { useState, useTransition } from 'react';
import { deleteConversationAction } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Trash2, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DeleteConversationButton({ userId, guildId }: { userId: string; guildId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      disabled={pending || done}
      className={cn(
        'h-8 gap-1.5 px-3 text-xs font-semibold transition-all duration-200 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-50',
        done && 'text-emerald-400 hover:text-emerald-400 hover:bg-transparent disabled:opacity-100',
      )}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteConversationAction(userId, guildId);
            setDone(true);
          } catch {
            /* retry if fails */
          }
        })
      }
    >
      {pending ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          Đang xoá
        </>
      ) : done ? (
        <>
          <Check className="h-3 w-3" />
          Đã xoá
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          Xoá
        </>
      )}
    </Button>
  );
}
