import { estimateTokens } from '@daa/shared';
import type { GeminiService } from '../ai/gemini.service';
import {
  SYSTEM_PROMPTS,
  buildCodePrompt,
  buildContextBlock,
  buildSummaryPrompt,
  buildTarotPrompt,
  buildTranslatePrompt,
  type PromptContext,
  type SummarySourceMessage,
} from '../ai/prompts';
import type { UserRepository } from '../database/repositories';
import type { MemoryService } from './memory.service';
import type { Logger } from '../utils/logger';

export interface ChatContext {
  userId: string;
  username: string;
  displayName?: string;
  guildId: string | null;
  guildName?: string;
  channelName?: string;
  /** Optional per-guild model override. */
  model?: string;
}

/**
 * Orchestrates the AI use-cases (the application's "service layer"): wires
 * together the Gemini client, conversation memory and per-user token accounting.
 */
export class ChatService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly memory: MemoryService,
    private readonly users: UserRepository,
    private readonly logger?: Logger,
  ) {}

  /** Build a PromptContext from a ChatContext for system prompt enrichment. */
  private toPromptContext(ctx: ChatContext): PromptContext {
    return {
      username: ctx.username,
      displayName: ctx.displayName,
      guildName: ctx.guildName,
      channelName: ctx.channelName,
      timestamp: new Date().toISOString(),
    };
  }

  /** Enrich a base system prompt with runtime context. */
  private enrichSystem(basePrompt: string, ctx: ChatContext): string {
    const contextBlock = buildContextBlock(this.toPromptContext(ctx));
    return `${basePrompt}\n\n--- CONTEXT ---\n${contextBlock}`;
  }

  /** `/ask` — context-aware chat with memory. */
  async ask(ctx: ChatContext, question: string): Promise<string> {
    await this.users.upsert(ctx.userId, ctx.username);
    const history = await this.memory.getContext(ctx.userId, ctx.guildId);

    const result = await this.gemini.chat(
      history.map((m) => ({ role: m.role, content: m.content })),
      question,
      {
        model: ctx.model,
        system: this.enrichSystem(SYSTEM_PROMPTS.chat, ctx),
        thinkingBudget: 1024,
      },
    );

    await this.memory.record(ctx.userId, ctx.guildId, [
      { role: 'user', content: question, tokens: estimateTokens(question) },
      { role: 'model', content: result.text, tokens: result.usage.completionTokens },
    ]);
    await this.users.incrementTokens(ctx.userId, result.usage.totalTokens);
    return result.text;
  }

  /** `/code` — code generation with explanation + best practices. */
  async code(ctx: ChatContext, prompt: string): Promise<string> {
    await this.users.upsert(ctx.userId, ctx.username);
    const result = await this.gemini.generate(buildCodePrompt(prompt), {
      model: ctx.model,
      system: this.enrichSystem(SYSTEM_PROMPTS.code, ctx),
      temperature: 0.3,
      thinkingBudget: 4096,
    });
    await this.users.incrementTokens(ctx.userId, result.usage.totalTokens);
    return result.text;
  }

  /** `/translate` — faithful translation between languages. */
  async translate(ctx: ChatContext, text: string, from: string, to: string): Promise<string> {
    const result = await this.gemini.generate(buildTranslatePrompt(text, from, to), {
      model: ctx.model,
      system: SYSTEM_PROMPTS.translate,
      temperature: 0.2,
    });
    await this.users.incrementTokens(ctx.userId, result.usage.totalTokens);
    return result.text;
  }

  /** `/tarot` — luận giải trải bài tarot dựa trên các lá đã rút và câu hỏi. */
  async tarot(
    ctx: ChatContext,
    question: string | null,
    spreadDetails: string,
    spreadName: string,
    spreadDescription: string,
  ): Promise<string> {
    const result = await this.gemini.generate(
      buildTarotPrompt(question, spreadDetails, spreadName, spreadDescription),
      {
        model: ctx.model,
        system: SYSTEM_PROMPTS.tarot,
        temperature: 0.9,
      },
    );
    await this.users.incrementTokens(ctx.userId, result.usage.totalTokens);
    return result.text;
  }

  /** `/summary` — summarise recent channel messages. */
  async summarize(
    ctx: ChatContext,
    messages: SummarySourceMessage[],
    language: string,
  ): Promise<string> {
    const result = await this.gemini.generate(buildSummaryPrompt(messages, language), {
      model: ctx.model,
      system: this.enrichSystem(SYSTEM_PROMPTS.summary, ctx),
      temperature: 0.4,
    });
    await this.users.incrementTokens(ctx.userId, result.usage.totalTokens);
    return result.text;
  }
}

