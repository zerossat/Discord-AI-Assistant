'use client';

import { useState, useTransition } from 'react';
import { COMMON_LANGUAGES, SUPPORTED_AI_MODELS, type GuildSummary } from '@daa/shared';
import { updateGuildAction } from '@/app/dashboard/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, Globe, Key, Brain, ListCollapse, Users } from 'lucide-react';

const fieldInput = 'mt-1.5 w-full rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50';

export function ServerEditor({ guild, editable }: { guild: GuildSummary; editable: boolean }) {
  const [aiModel, setAiModel] = useState(guild.aiModel);
  const [prefix, setPrefix] = useState(guild.prefix);
  const [language, setLanguage] = useState(guild.language);
  const [memoryEnabled, setMemoryEnabled] = useState(guild.memoryEnabled);
  const [summaryMessageLimit, setSummaryMessageLimit] = useState(guild.summaryMessageLimit);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const modelKnown = SUPPORTED_AI_MODELS.some((m) => m === aiModel);

  function save() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateGuildAction(guild.guildId, {
          aiModel,
          prefix,
          language,
          memoryEnabled,
          summaryMessageLimit,
        });
        setMessage('✅ Cập nhật thành công');
      } catch (e) {
        setMessage('⚠️ ' + (e instanceof Error ? e.message : 'Lưu thất bại'));
      }
    });
  }

  return (
    <Card className="border-white/5 bg-white/[0.01] overflow-hidden">
      {/* Server Heading Header */}
      <CardHeader className="border-b border-white/5 bg-white/[0.005] px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {guild.name ?? guild.guildId}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              ID: <code>{guild.guildId}</code>
            </CardDescription>
          </div>
          {guild.memberCount != null && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 py-1 px-3 text-xs font-semibold text-slate-300 self-start sm:self-auto">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {guild.memberCount.toLocaleString('vi-VN')} thành viên
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* AI Model Config */}
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            <span className="flex items-center gap-1.5 mb-0.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              Mô hình trí tuệ nhân tạo (AI Model)
            </span>
            <select
              className={fieldInput}
              value={aiModel}
              disabled={!editable}
              onChange={(e) => setAiModel(e.target.value)}
            >
              {!modelKnown && <option value={aiModel}>{aiModel} (cũ)</option>}
              {SUPPORTED_AI_MODELS.map((m) => (
                <option key={m} value={m} className="bg-[#0f0f13]">
                  {m}
                </option>
              ))}
            </select>
          </label>

          {/* Localization Language Config */}
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            <span className="flex items-center gap-1.5 mb-0.5">
              <Globe className="h-3.5 w-3.5 text-indigo-400" />
              Ngôn ngữ phản hồi
            </span>
            <select
              className={fieldInput}
              value={language}
              disabled={!editable}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {Object.entries(COMMON_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code} className="bg-[#0f0f13]">
                  {name} ({code})
                </option>
              ))}
            </select>
          </label>

          {/* Bot Command Prefix Config */}
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            <span className="flex items-center gap-1.5 mb-0.5">
              <Key className="h-3.5 w-3.5 text-amber-400" />
              Tiền tố lệnh (Prefix)
            </span>
            <input
              className={fieldInput}
              value={prefix}
              maxLength={5}
              disabled={!editable}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </label>

          {/* Summary Message Limit Config */}
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            <span className="flex items-center gap-1.5 mb-0.5">
              <ListCollapse className="h-3.5 w-3.5 text-cyan-400" />
              Số tin nhắn tóm tắt tối đa (/summary)
            </span>
            <input
              type="number"
              min={1}
              max={500}
              className={fieldInput}
              value={summaryMessageLimit}
              disabled={!editable}
              onChange={(e) => setSummaryMessageLimit(Number(e.target.value))}
            />
          </label>
        </div>

        {/* Memory Toggle */}
        <div className="pt-2">
          <label className="relative flex items-start gap-3 cursor-pointer group">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
                checked={memoryEnabled}
                disabled={!editable}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
              />
            </div>
            <div className="text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-white group-hover:text-primary transition-colors">
                <Brain className="h-4 w-4 text-emerald-400" />
                Kích hoạt bộ nhớ ngữ cảnh hội thoại
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Cho phép bot lưu trữ lịch sử hội thoại gần nhất để hồi đáp thông minh, liền mạch.
              </p>
            </div>
          </label>
        </div>

        {/* Action Panel */}
        {editable && (
          <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-2">
            <div className="text-sm font-semibold">
              {message && (
                <span className={message.startsWith('⚠️') ? 'text-rose-400' : 'text-emerald-400'}>
                  {message}
                </span>
              )}
            </div>
            <Button
              onClick={save}
              disabled={pending}
              className="bg-gradient-to-r from-primary to-indigo-600 font-semibold text-white transition-all shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {pending ? 'Đang cập nhật…' : 'Lưu cấu hình'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
