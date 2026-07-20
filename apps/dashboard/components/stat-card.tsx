import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  // Determine color themes dynamically based on label
  const getTheme = () => {
    switch (label) {
      case 'Người dùng':
        return {
          iconClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          glowClass: 'from-blue-500/5 to-transparent',
        };
      case 'Hội thoại':
        return {
          iconClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          glowClass: 'from-purple-500/5 to-transparent',
        };
      case 'Servers':
        return {
          iconClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          glowClass: 'from-indigo-500/5 to-transparent',
        };
      case 'Tin nhắn':
        return {
          iconClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          glowClass: 'from-cyan-500/5 to-transparent',
        };
      case 'AI Tokens':
        return {
          iconClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          glowClass: 'from-amber-500/5 to-transparent',
        };
      default:
        return {
          iconClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
          glowClass: 'from-slate-500/5 to-transparent',
        };
    }
  };

  const theme = getTheme();

  return (
    <Card className="relative overflow-hidden border-white/5 bg-white/[0.01] transition-all duration-300 hover:scale-[1.02] hover:bg-white/[0.02] hover:border-white/10">
      {/* Decorative Glow inside Card */}
      <div className={cn("absolute -right-4 -bottom-4 h-24 w-24 bg-gradient-to-br rounded-full blur-xl opacity-50 pointer-events-none", theme.glowClass)} />

      <CardContent className="flex items-center gap-5 p-6 relative z-10">
        <div className={cn("rounded-xl p-3.5 border transition-all duration-300", theme.iconClass)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            {formatNumber(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
