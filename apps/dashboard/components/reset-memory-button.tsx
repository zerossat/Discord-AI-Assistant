'use client';

import { useState, useTransition } from 'react';
import { resetUserMemoryAction } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResetMemoryButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending || state === 'done'}
      className={cn(
        'h-8 gap-1.5 px-3 text-xs font-semibold transition-all duration-200 border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50',
        state === 'done' &&
          'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 disabled:opacity-100',
      )}
      onClick={() =>
        startTransition(async () => {
          try {
            await resetUserMemoryAction(userId);
            setState('done');
            setTimeout(() => setState('idle'), 3000); // revert back to idle after 3s
          } catch {
            setState('error');
            setTimeout(() => setState('idle'), 3000);
          }
        })
      }
    >
      {pending ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          Đang xoá
        </>
      ) : state === 'done' ? (
        <>
          <Check className="h-3 w-3" />
          Đã reset
        </>
      ) : state === 'error' ? (
        <>
          <AlertCircle className="h-3 w-3" />
          Lỗi
        </>
      ) : (
        <>
          <RefreshCw className="h-3 w-3" />
          Reset bộ nhớ
        </>
      )}
    </Button>
  );
}
