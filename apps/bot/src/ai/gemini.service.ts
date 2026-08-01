import { GoogleGenAI, type Content, type GenerateContentResponse } from '@google/genai';
import { estimateTokens, sleep, type AiGenerationResult, type ChatRole } from '@daa/shared';
import type { Logger } from '../utils/logger';

export interface GeminiServiceOptions {
  /** One or more API keys. The client rotates to the next key on a 429. */
  apiKeys: string[];
  defaultModel: string;
  /** Models tried (in order) when the primary model is exhausted/unavailable. */
  fallbackModels?: string[];
  /** Transient (503 / short-retry 429) attempts per key before moving on. */
  maxRetries?: number;
  logger?: Logger;
}

export interface GenerateOptions {
  model?: string;
  system?: string;
  temperature?: number;
  /** Token budget for Gemini 2.5 thinking/reasoning mode. Set to 0 to disable. */
  thinkingBudget?: number;
}

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

/** How a failed request should be handled. */
interface FailureKind {
  /** Worth retrying the *same* key shortly (503, or a 429 with a short retry delay). */
  transient: boolean;
  /** 429 / quota exhausted — move on to the next key. */
  rateLimited: boolean;
  /** 404 / model retired or unsupported — skip straight to the next model. */
  modelUnavailable: boolean;
  /** Server-suggested retry delay in ms, when provided. */
  retryMs: number | null;
}

interface SuccessfulCall {
  response: GenerateContentResponse;
  model: string;
}

/**
 * Wrapper around the Google Gen AI SDK (`@google/genai`). Adds provider
 * decoupling, token-usage accounting and resilience: it rotates across every
 * configured API key on rate limits and falls back through a chain of models
 * when the primary one is throttled or no longer available.
 */
export class GeminiService {
  private readonly clients: GoogleGenAI[];
  private readonly defaultModel: string;
  private readonly fallbackModels: string[];
  private readonly maxRetries: number;
  private readonly logger?: Logger;

  constructor(options: GeminiServiceOptions) {
    const keys = options.apiKeys.map((k) => k.trim()).filter((k) => k.length > 0);
    if (keys.length === 0) {
      throw new Error('GeminiService requires at least one API key');
    }
    this.clients = keys.map((apiKey) => new GoogleGenAI({ apiKey }));
    this.defaultModel = options.defaultModel;
    this.fallbackModels = options.fallbackModels ?? [];
    this.maxRetries = options.maxRetries ?? 2;
    this.logger = options.logger;
  }

  /** One-shot generation from a single prompt. */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<AiGenerationResult> {
    const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
    const { response, model } = await this.run(contents, options);
    const text = response.text ?? '';
    return { text, model, usage: this.usage(response, prompt, text) };
  }

  /** Multi-turn generation given prior history plus a new user message. */
  async chat(
    history: ChatTurn[],
    message: string,
    options: GenerateOptions = {},
  ): Promise<AiGenerationResult> {
    const contents: Content[] = [
      ...history
        .filter((turn) => turn.role !== 'system')
        .map((turn) => ({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        })),
      { role: 'user', parts: [{ text: message }] },
    ];
    const { response, model } = await this.run(contents, options);
    const text = response.text ?? '';
    const promptText = history.map((h) => h.content).join('\n') + message;
    return { text, model, usage: this.usage(response, promptText, text) };
  }

  /**
   * Try the primary model, then each fallback model, rotating across every key
   * for each. Transient errors retry the same key with backoff; rate limits
   * advance to the next key; retired/unsupported models advance to the next
   * model; anything else fails fast.
   */
  private async run(contents: Content[], options: GenerateOptions): Promise<SuccessfulCall> {
    const primary = options.model ?? this.defaultModel;
    const models = [primary, ...this.fallbackModels.filter((m) => m !== primary)];
    let lastError: unknown;

    for (const model of models) {
      const outcome = await this.tryModel(model, contents, options);
      if (outcome.response) {
        if (model !== primary) {
          this.logger?.warn({ primary, model }, 'Gemini served request from fallback model');
        }
        return { response: outcome.response, model };
      }
      lastError = outcome.error;
      // Only advance to the next model for rate-limit / unavailable failures.
      if (!outcome.tryNextModel) break;
    }

    throw this.toFriendlyError(lastError);
  }

  /** Attempt one model across all keys. Returns a response, or why it failed. */
  private async tryModel(
    model: string,
    contents: Content[],
    options: GenerateOptions,
  ): Promise<{ response?: GenerateContentResponse; error?: unknown; tryNextModel: boolean }> {
    let lastError: unknown;

    for (const [keyIndex, client] of this.clients.entries()) {
      for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
        try {
          const thinkingEnabled =
            options.thinkingBudget != null &&
            options.thinkingBudget > 0 &&
            (model.includes('2.5') || model.includes('3.'));
          const response = await client.models.generateContent({
            model,
            contents,
            config: {
              ...(options.system ? { systemInstruction: options.system } : {}),
              temperature: options.temperature ?? 0.7,
              ...(thinkingEnabled
                ? { thinkingConfig: { thinkingBudget: options.thinkingBudget } }
                : {}),
            },
          });
          return { response, tryNextModel: false };
        } catch (err) {
          lastError = err;
          const kind = this.classify(err);

          if (kind.transient && attempt < this.maxRetries) {
            const retryMs = Math.min(kind.retryMs ?? 1000 * 2 ** attempt, 8000);
            this.logger?.warn({ model, keyIndex, attempt, retryMs }, 'Gemini throttled; retrying');
            await sleep(retryMs);
            continue; // retry the same key
          }

          if (kind.modelUnavailable) {
            this.logger?.warn({ model }, 'Gemini model unavailable; trying next model');
            return { error: err, tryNextModel: true };
          }

          if (kind.rateLimited) {
            this.logger?.warn({ model, keyIndex }, 'Gemini key rate-limited; trying next key');
            break; // move on to the next key
          }

          return { error: err, tryNextModel: false }; // unexpected — fail fast
        }
      }
    }

    // Every key was rate-limited for this model — let the caller try a fallback.
    return { error: lastError, tryNextModel: true };
  }

  private classify(err: unknown): FailureKind {
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: unknown }).status)
        : NaN;
    const message = err instanceof Error ? err.message : String(err);

    const is429 =
      status === 429 ||
      /\b429\b|RESOURCE_EXHAUSTED|Too Many Requests|rate limit|quota/i.test(message);
    const is503 = status === 503 || /\b503\b|overloaded|UNAVAILABLE/i.test(message);
    const is404 =
      status === 404 ||
      /\b404\b|NOT_FOUND|not found|is not supported|not supported|deprecated|retired/i.test(
        message,
      );
    const hardZeroQuota = /limit:\s*0/i.test(message);
    const retryMs = this.parseRetryDelayMs(message);

    return {
      // Retry the same key only for overloads, or 429s that name a short delay.
      transient: is503 || (is429 && !hardZeroQuota && retryMs !== null && retryMs <= 8000),
      rateLimited: is429,
      modelUnavailable: is404,
      retryMs,
    };
  }

  private toFriendlyError(err: unknown): Error {
    const kind = this.classify(err);
    const original = err instanceof Error ? err.message : String(err);

    if (kind.rateLimited) {
      return new Error(
        'Gemini đã vượt hạn mức (quota / rate limit) trên tất cả API key. ' +
          'Thử lại sau ít phút, thêm key vào GEMINI_API_KEYS, hoặc bật billing tại https://ai.dev/rate-limit',
      );
    }
    if (kind.modelUnavailable) {
      return new Error(
        'Model Gemini không khả dụng hoặc đã ngừng hỗ trợ. ' +
          `Hãy đặt GEMINI_MODEL về model hiện hành (vd: gemini-2.5-flash). Chi tiết: ${original}`,
      );
    }
    return err instanceof Error ? err : new Error(original);
  }

  private parseRetryDelayMs(message: string): number | null {
    const match = message.match(/retry(?:Delay)?[":\s]+([\d.]+)s/i);
    const seconds = match?.[1];
    return seconds ? Math.ceil(Number(seconds) * 1000) : null;
  }

  private usage(
    response: GenerateContentResponse,
    promptText: string,
    completion: string,
  ): AiGenerationResult['usage'] {
    const meta = response.usageMetadata;
    if (meta) {
      return {
        promptTokens: meta.promptTokenCount ?? 0,
        completionTokens: meta.candidatesTokenCount ?? 0,
        totalTokens: meta.totalTokenCount ?? 0,
      };
    }
    // Fallback when the provider omits usage metadata.
    const promptTokens = estimateTokens(promptText);
    const completionTokens = estimateTokens(completion);
    return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
  }
}
