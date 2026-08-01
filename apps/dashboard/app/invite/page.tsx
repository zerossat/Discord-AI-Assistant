import {
  Bot,
  MessageSquare,
  Code2,
  Globe,
  Music,
  Sparkles,
  Shield,
  Zap,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const BOT_PERMISSIONS = '3263488'; // View Channels, Send Messages, Embed Links, Attach Files, Read History, Connect, Speak
const SCOPES = 'bot applications.commands';

function getInviteUrl(): string {
  const clientId = process.env.DISCORD_CLIENT_ID ?? '';
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${BOT_PERMISSIONS}&scope=${encodeURIComponent(SCOPES)}`;
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Trò chuyện AI',
    description: 'Trả lời thông minh với ngữ cảnh, ghi nhớ lịch sử hội thoại.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Code2,
    title: 'Hỗ trợ Code',
    description: 'Viết, giải thích và debug code với nhiều ngôn ngữ lập trình.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Globe,
    title: 'Dịch thuật',
    description: 'Dịch nhanh giữa 8+ ngôn ngữ phổ biến trên thế giới.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Music,
    title: 'Đọc TTS',
    description: 'Chuyển văn bản thành giọng nói và phát trực tiếp trong voice channel.',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    icon: Sparkles,
    title: 'Bói Tarot',
    description: 'Rút bài Tarot và nhận lời giải bài chuyên sâu từ AI.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Shield,
    title: 'Cấu hình linh hoạt',
    description: 'Tùy chỉnh model AI, prefix, bộ nhớ riêng cho từng server.',
    gradient: 'from-amber-500 to-yellow-600',
  },
];

export default function InvitePage() {
  const inviteUrl = getInviteUrl();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Discord AI Assistant';

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
          >
            <Bot className="h-5 w-5 text-primary" />
            {appName}
          </Link>
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Zap className="h-3.5 w-3.5" />
          Powered by Gemini AI
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-primary/20 blur-2xl" />
          <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 backdrop-blur-sm">
            <Bot className="h-16 w-16 text-primary sm:h-20 sm:w-20" />
          </div>
        </div>

        <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Thêm{' '}
          <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            {appName}
          </span>
          <br />
          vào server của bạn
        </h1>

        <p className="mb-10 max-w-xl text-lg text-muted-foreground">
          Trợ lý AI đa năng cho Discord — trò chuyện, lập trình, dịch thuật, tóm tắt, bói Tarot và
          nhiều hơn nữa. Miễn phí và dễ dàng thiết lập.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <a
            id="invite-bot-button"
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#5865F2] px-8 text-base font-semibold text-white shadow-lg shadow-[#5865F2]/25 transition-all hover:scale-105 hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/30 active:scale-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Mời vào Server
            <ExternalLink className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </a>

          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-8 text-base font-medium transition-all hover:bg-secondary"
          >
            Mở Dashboard
          </Link>
        </div>

        <p className="mt-5 text-xs text-muted-foreground/70">
          Không cần thẻ tín dụng • Thiết lập trong 30 giây
        </p>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Tính năng nổi bật
            </h2>
            <p className="text-muted-foreground">
              Mọi thứ bạn cần cho một server Discord thông minh hơn.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${f.gradient} p-2.5 text-white shadow-sm`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-border/50">
        <div className="container flex flex-col items-center px-6 py-20 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">Sẵn sàng bắt đầu?</h2>
          <p className="mb-8 max-w-md text-muted-foreground">
            Chỉ cần một cú click để thêm bot vào server. Hoàn toàn miễn phí.
          </p>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#5865F2] px-8 text-base font-semibold text-white shadow-lg shadow-[#5865F2]/25 transition-all hover:scale-105 hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/30 active:scale-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Mời vào Server
            <ExternalLink className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            {appName}
          </div>
          <p>Built with ❤️ using Gemini AI &amp; Discord.js</p>
        </div>
      </footer>
    </main>
  );
}
