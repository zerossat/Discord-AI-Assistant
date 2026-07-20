import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bot, ExternalLink, User } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';
import { Nav } from '@/components/nav';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Discord AI Assistant';

  return (
    <div className="min-h-screen bg-[#070709] text-slate-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0c]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-indigo-600 p-1.5 shadow-md shadow-primary/10 transition-transform group-hover:scale-105">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent group-hover:text-white transition-colors">
              {appName}
            </span>
          </Link>

          {/* Quick Stats / Session Info */}
          <div className="flex items-center gap-4">
            <Link
              id="layout-invite"
              href="/invite"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              Mời Bot
              <ExternalLink className="h-3 w-3" />
            </Link>

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 py-1 px-3">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">
                  {session.user?.name ?? session.user?.username}
                </span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Sub-nav Links */}
      <div className="border-b border-white/5 bg-[#0a0a0c]/40">
        <div className="mx-auto max-w-7xl px-6 py-2">
          <Nav />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
