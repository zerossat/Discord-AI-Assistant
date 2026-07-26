import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  ExternalLink,
  MessageSquare,
  Code,
  Languages,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Terminal,
} from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { SignInButton } from '@/components/sign-in-button';

export default async function Home() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }
  if (session) redirect('/dashboard');

  const features = [
    {
      icon: MessageSquare,
      title: 'Hội Thoại Thông Minh',
      desc: 'Trò chuyện tự nhiên như người thật với khả năng ghi nhớ ngữ cảnh cực tốt nhờ hệ thống bộ nhớ trượt cached bằng Redis và lưu trữ Mongo.',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: Code,
      title: 'Hỗ Trợ Lập Trình Chuyên Sâu',
      desc: 'Sinh code, giải thích thuật toán, phân tích lỗi và đề xuất tối ưu hóa bảo mật sử dụng chế độ tư duy sâu (Reasoning Mode) của Gemini 2.5.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: Sparkles,
      title: 'Bói Bài Tarot Chiêm Nghiệm',
      desc: 'Rút 1 lá hoặc 3 lá bài Tarot ngẫu nhiên và nhận luận giải sâu sắc từ AI Reader bằng tiếng Việt. Cung cấp lời khuyên thiết thực cho bạn.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Bot,
      title: 'Giọng Đọc TTS Cao Cấp',
      desc: 'Chuyển văn bản thành giọng nói trong kênh voice của bạn. Tự động chuyển đổi sang giọng đọc tự nhiên của Gemini hoặc Google TTS miễn phí.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Languages,
      title: 'Dịch Thuật & Tóm Tắt Kênh',
      desc: 'Dịch chuẩn xác đa ngôn ngữ và tóm tắt nhanh nội dung các cuộc thảo luận dài trong kênh chat chỉ với một câu lệnh Slash duy nhất.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    },
    {
      icon: Terminal,
      title: 'Quản Trị Trực Quan',
      desc: 'Theo dõi lượng tokens sử dụng, quản lý thành viên và điều chỉnh chi tiết cấu hình (Prefix, Language, Memory) của từng server qua Web Dashboard.',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime Hoạt Động', icon: Zap },
    { value: '1s', label: 'Tốc Độ Phản Hồi AI', icon: Shield },
    { value: '10K+', label: 'Tin Nhắn Đã Xử Lý', icon: Users },
  ];

  const faqs = [
    {
      q: 'Bot sử dụng mô hình trí tuệ nhân tạo nào?',
      a: 'Bot tích hợp trực tiếp SDK Google Gen AI tiên tiến nhất, mặc định chạy mô hình Gemini 2.5 Flash thông thái và hỗ trợ cấu hình chuyển đổi sang các phiên bản khác linh hoạt qua trang Dashboard quản trị.',
    },
    {
      q: 'Tính năng bộ nhớ hoạt động ra sao?',
      a: 'Bot sử dụng cơ chế lưu trữ lịch sử tin nhắn dạng cửa sổ trượt (sliding window). Dữ liệu hội thoại gần nhất được lưu trong MongoDB và lưu đệm trên Redis giúp phản hồi siêu tốc và nhận diện đúng ngữ cảnh câu hỏi tiếp theo.',
    },
    {
      q: 'Giọng đọc của Gemini và Google TTS có gì khác biệt?',
      a: 'Giọng đọc Google là giải pháp miễn phí và ổn định. Giọng đọc Gemini sử dụng tính năng sinh âm thanh trực tiếp (Native TTS Audio) đem lại cảm giác tự nhiên, sống động và truyền cảm hơn rất nhiều.',
    },
    {
      q: 'Làm thế nào để mời bot vào Discord server?',
      a: 'Bạn chỉ cần nhấn nút "Mời Bot vào Server" ở đầu trang, cấp các quyền cơ bản (đặc biệt là Message Content Intent để dùng tính năng tóm tắt) và gõ lệnh `/menu` trong server để bắt đầu tương tác.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0c] text-slate-100 selection:bg-primary/30 selection:text-white">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(88,101,242,0.12),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute top-1/2 right-1/4 h-[250px] w-[250px] rounded-full bg-purple-500/5 blur-[100px]" />

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-purple-600 p-2 shadow-lg shadow-primary/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Discord AI Assistant
            </span>
          </div>
          <div className="hidden sm:block">
            <Link
              id="header-invite-btn"
              href="/invite"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20"
            >
              Mời Bot
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-8 animate-pulse">
          <Sparkles className="h-3 w-3" />
          Tích Hợp Google Gemini 2.5 Flash
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-tight">
          Nâng Tầm Discord Server Với <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Trợ Lý AI Gemini
          </span>{' '}
          Thế Hệ Mới
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          Trò chuyện tự nhiên, sinh mã nguồn thông minh, tóm tắt kênh chat và chuyển đổi văn bản sang
          giọng nói (TTS) sống động – một hệ sinh thái AI toàn diện nâng tầm máy chủ của bạn.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <SignInButton />
          <Link
            id="cta-invite"
            href="/invite"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-8 text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Mời Bot vào Server
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="mx-auto mt-20 max-w-4xl border-t border-b border-white/5 py-8">
          <div className="grid grid-cols-3 gap-6">
            {stats.map((s, index) => {
              const Icon = s.icon;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-white sm:text-3xl">
                    <Icon className="h-5 w-5 text-primary" />
                    {s.value}
                  </div>
                  <div className="text-xs font-medium text-slate-400 sm:text-sm">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 bg-gradient-to-b from-transparent via-[#0d0d11] to-transparent">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Các tính năng vượt trội
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400">
            Trải nghiệm hệ thống câu lệnh Slash chuyên sâu phục vụ hoàn hảo mọi nhu cầu của server.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-2xl hover:shadow-primary/5 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 space-y-4">
                  <div className={`inline-flex rounded-xl p-3 border ${feat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Câu hỏi thường gặp
          </h2>
          <p className="text-slate-400">Tất cả những gì bạn cần biết trước khi bắt đầu.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group rounded-xl border border-white/5 bg-white/[0.01] p-6 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:bg-white/[0.03] open:border-white/10"
            >
              <summary className="flex cursor-pointer items-center justify-between text-left focus:outline-none">
                <span className="flex items-center gap-3 text-base font-semibold text-white group-hover:text-primary transition-colors">
                  <HelpCircle className="h-5 w-5 text-slate-500 shrink-0" />
                  {faq.q}
                </span>
                <span className="ml-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                  <ArrowRight className="h-3.5 w-3.5 rotate-90 group-open:-rotate-90 transition-transform duration-300" />
                </span>
              </summary>
              <div className="mt-4 pl-8 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent to-[#070709] py-20 text-center">
        <div className="mx-auto max-w-4xl px-6 space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Sẵn sàng kết nối AI đến cộng đồng của bạn?
          </h2>
          <p className="mx-auto max-w-xl text-slate-400">
            Tham gia ngay hôm nay để tối ưu hóa công việc, tương tác thú vị hơn và quản lý máy chủ
            chuyên nghiệp hơn bao giờ hết.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <SignInButton />
            <Link
              id="bottom-invite"
              href="/invite"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-8 text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20"
            >
              Mời Bot
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} Discord AI Assistant. All rights reserved.</p>
          <p>
            Powered by{' '}
            <span className="text-primary font-semibold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Gemini 2.5 Flash
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

