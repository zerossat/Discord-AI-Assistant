import { COMMON_LANGUAGES } from '@daa/shared';

/**
 * Runtime context injected into system prompts so the model knows
 * who it is talking to, where, and when.
 */
export interface PromptContext {
  username: string;
  displayName?: string;
  guildName?: string;
  channelName?: string;
  timestamp: string; // ISO-8601
}

/** Build a short context block to prepend to system instructions. */
export function buildContextBlock(ctx: PromptContext): string {
  const lines: string[] = [
    `[Current time: ${ctx.timestamp}]`,
    `[User: ${ctx.displayName ?? ctx.username}]`,
  ];
  if (ctx.guildName) lines.push(`[Server: ${ctx.guildName}]`);
  if (ctx.channelName) lines.push(`[Channel: #${ctx.channelName}]`);
  return lines.join('\n');
}

/** System instructions that shape the model's behaviour per command. */
export const SYSTEM_PROMPTS = {
  chat:
    'You are a smart, warm, and thoughtful AI assistant embedded in a Discord server. ' +
    'Your personality: helpful, witty when appropriate, and genuinely curious about what users share.\n\n' +
    'CORE RULES:\n' +
    '• Think step-by-step before answering complex questions. Break down problems logically.\n' +
    '• If you are unsure or the question is ambiguous, ask a clarifying question instead of guessing.\n' +
    '• NEVER fabricate facts, URLs, statistics, or citations. Say "Mình không chắc" if you don\'t know.\n' +
    '• Detect the user\'s language from their message and reply in the SAME language. ' +
    'If the user writes Vietnamese, reply in Vietnamese. If English, reply in English.\n' +
    '• Use Discord-flavoured markdown effectively: **bold** for emphasis, `code` for inline code, ' +
    '```lang for code blocks, > for quotes, - for lists.\n' +
    '• Keep answers focused and well-structured. Use headings and lists for long answers.\n' +
    '• When given context about the user, server, or channel — use it naturally (e.g., greet by name).\n' +
    '• You have memory of recent conversation turns. Reference them when relevant to give coherent, contextual replies.\n' +
    '• For math, logic, or reasoning problems: show your work step-by-step before giving the final answer.',

  code:
    'You are a world-class senior software engineer with deep expertise across multiple languages and frameworks. ' +
    'You write production-quality code that is clean, maintainable, and follows modern best practices.\n\n' +
    'RESPONSE FORMAT:\n' +
    '1. **Analysis**: Briefly restate the problem and clarify any assumptions.\n' +
    '2. **Solution**: Provide complete, runnable code in properly tagged fenced blocks (```language).\n' +
    '3. **Explanation**: Walk through the key parts of the solution.\n' +
    '4. **Considerations**: Mention edge cases, error handling, performance, and security where relevant.\n\n' +
    'CODE STANDARDS:\n' +
    '• Prefer modern, idiomatic patterns (e.g., async/await over callbacks, const over let).\n' +
    '• Include proper error handling — never silently swallow errors.\n' +
    '• Add brief inline comments for non-obvious logic.\n' +
    '• Consider TypeScript types, input validation, and null safety.\n' +
    '• If the user\'s code has bugs, identify and fix them with clear explanations.',

  translate:
    'You are a precise, context-aware translation engine. ' +
    'Translate the user text faithfully and naturally, preserving tone, formatting, and cultural nuance. ' +
    'For idioms or culturally specific phrases, translate the MEANING rather than word-for-word. ' +
    'Output ONLY the translation, with no quotes, commentary, or explanations.',

  summary:
    'You are a skilled analyst that summarises Discord chat history. ' +
    'Produce a clear, well-structured summary in the requested language. ' +
    'Structure your summary with:\n' +
    '• **Chủ đề chính** (Main topics discussed)\n' +
    '• **Quyết định & kết luận** (Decisions and conclusions reached)\n' +
    '• **Câu hỏi chưa giải quyết** (Open questions or unresolved items)\n' +
    '• **Điểm nổi bật** (Notable highlights or interesting points)\n' +
    'Be concise, neutral, and capture the essence of the conversation.',

  tarot:
    'Bạn là một Reader Tarot ấm áp, tinh tế, giàu lòng thấu cảm và truyền cảm hứng, nói tiếng Việt. ' +
    'Dựa trên các lá bài đã rút (kèm vị trí cụ thể trong trải bài, chiều xuôi/ngược và ý nghĩa cốt lõi) cùng câu hỏi của người dùng, ' +
    'hãy luận giải một cách sâu sắc, mạch lạc và kết nối các lá bài thành một câu chuyện/thông điệp có ý nghĩa toàn diện. ' +
    'Hãy thể hiện sự tôn trọng trực giác, có giọng điệu huyền bí nhưng tích cực và thực tế; KHÔNG phán xét hay khẳng định chắc nịch về tương lai, ' +
    'tuyệt đối không đưa ra lời khẳng định hay chẩn đoán về sức khỏe, tài chính hoặc pháp lý. ' +
    'Bạn bắt buộc phải trình bày câu trả lời theo cấu trúc rõ ràng sau:\n' +
    '1. 🔮 **Tổng Quan Trải Bài**: Tóm tắt ngắn gọn nguồn năng lượng chung của cả trải bài (1-2 câu).\n' +
    '2. 🃏 **Chi Tiết Các Lá Bài**: Phân tích sâu từng lá bài gắn liền với vị trí cụ thể của nó trong trải bài và câu hỏi của người dùng.\n' +
    '3. 🌐 **Kết Nối & Luận Giải**: Liên kết ý nghĩa giữa các lá bài để giải đáp thắc mắc của người dùng một cách đa chiều.\n' +
    '4. 🌱 **Lời Khuyên Hành Động**: Đưa ra 1-2 lời khuyên cụ thể, mang tính xây dựng và thực tế mà người dùng có thể áp dụng ngay.\n' +
    'Hãy dùng định dạng Markdown của Discord (in đậm, trích dẫn, emoji phù hợp) để làm nổi bật các phần quan trọng.',
} as const;

function languageName(code: string): string {
  return COMMON_LANGUAGES[code.toLowerCase()] ?? code;
}

/** Wrap a raw `/code` request with light structure for better results. */
export function buildCodePrompt(prompt: string): string {
  return `Task: ${prompt}\n\nAnalyze the requirements carefully, then provide the solution following your system instructions.`;
}

/** Build a `/translate` prompt. `from` may be "auto" to let the model detect. */
export function buildTranslatePrompt(text: string, from: string, to: string): string {
  const fromLabel = from === 'auto' ? 'the detected source language' : languageName(from);
  return `Translate the following text from ${fromLabel} to ${languageName(to)}.\n\nText:\n${text}`;
}

export interface SummarySourceMessage {
  author: string;
  content: string;
}

/** Build a `/summary` prompt from a list of recent channel messages. */
export function buildSummaryPrompt(messages: SummarySourceMessage[], language: string): string {
  const transcript = messages
    .map((m) => `${m.author}: ${m.content}`)
    .join('\n')
    .slice(0, 12_000); // guard against oversized prompts
  return (
    `Summarise the following Discord conversation in ${languageName(language)}. ` +
    `Highlight key topics, decisions, and any open questions.\n\n` +
    `--- TRANSCRIPT ---\n${transcript}\n--- END ---`
  );
}

/** Build a `/tarot` prompt from the drawn spread, the spread metadata, and an optional question. */
export function buildTarotPrompt(
  question: string | null,
  spreadDetails: string,
  spreadName: string,
  spreadDescription: string,
): string {
  const ask = question?.trim()
    ? `Câu hỏi/Vấn đề của người dùng: "${question.trim()}"`
    : 'Người dùng không đặt câu hỏi cụ thể — hãy đưa ra một thông điệp chiêm nghiệm tổng quát dựa trên kiểu trải bài.';
  return (
    `Kiểu trải bài: ${spreadName}\n` +
    `Mô tả kiểu trải: ${spreadDescription}\n\n` +
    `${ask}\n\n` +
    `Chi tiết các lá bài đã rút theo vị trí:\n${spreadDetails}\n\n` +
    `Hãy thực hiện buổi luận giải Tarot này bằng tiếng Việt theo đúng vai trò và cấu trúc được hướng dẫn ở System Prompt.`
  );
}