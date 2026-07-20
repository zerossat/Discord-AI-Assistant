'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Server,
  Users,
  MessagesSquare,
  Activity,
} from 'lucide-react';

const LINKS = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/dashboard/servers', label: 'Servers', icon: Server },
  { href: '/dashboard/users', label: 'Người dùng', icon: Users },
  { href: '/dashboard/conversations', label: 'Hội thoại', icon: MessagesSquare },
  { href: '/dashboard/status', label: 'Trạng thái', icon: Activity },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const active =
          link.href === '/dashboard' ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/10'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'text-white' : 'text-slate-500')} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
