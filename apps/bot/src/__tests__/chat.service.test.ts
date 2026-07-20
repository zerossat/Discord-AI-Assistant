import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiGenerationResult } from '@daa/shared';
import { ChatService } from '../services/chat.service';
import type { GeminiService } from '../ai/gemini.service';
import type { MemoryService } from '../services/memory.service';
import type { UserRepository } from '../database/repositories';

const usage = { promptTokens: 5, completionTokens: 3, totalTokens: 8 };

function createFakes() {
  const gemini = {
    chat: vi.fn(
      async (): Promise<AiGenerationResult> => ({
        text: 'Hello from Gemini',
        model: 'gemini-2.5-flash',
        usage,
      }),
    ),
    generate: vi.fn(
      async (): Promise<AiGenerationResult> => ({
        text: 'generated',
        model: 'gemini-2.5-flash',
        usage,
      }),
    ),
  };
  const memory = {
    getContext: vi.fn(async () => []),
    record: vi.fn(
      async (
        _userId: string,
        _guildId: string | null,
        _turns: { role: string; content: string }[],
      ) => undefined,
    ),
    reset: vi.fn(async () => undefined),
  };
  const users = {
    upsert: vi.fn(async () => undefined),
    incrementTokens: vi.fn(async () => undefined),
  };
  return { gemini, memory, users };
}

describe('ChatService', () => {
  let fakes: ReturnType<typeof createFakes>;
  let chat: ChatService;
  const ctx = { userId: 'u1', username: 'alice', guildId: 'g1' as string | null };

  beforeEach(() => {
    fakes = createFakes();
    chat = new ChatService(
      fakes.gemini as unknown as GeminiService,
      fakes.memory as unknown as MemoryService,
      fakes.users as unknown as UserRepository,
    );
  });

  it('ask(): upserts the user, records two turns and bills tokens', async () => {
    const answer = await chat.ask(ctx, 'What is Docker?');

    expect(answer).toBe('Hello from Gemini');
    expect(fakes.users.upsert).toHaveBeenCalledWith('u1', 'alice');
    expect(fakes.memory.getContext).toHaveBeenCalledWith('u1', 'g1');

    const recordArgs = fakes.memory.record.mock.calls[0];
    expect(recordArgs?.[2]).toHaveLength(2);
    expect(fakes.users.incrementTokens).toHaveBeenCalledWith('u1', 8);
  });

  it('code(): generates without writing to memory', async () => {
    const answer = await chat.code(ctx, 'build a REST API');

    expect(answer).toBe('generated');
    expect(fakes.gemini.generate).toHaveBeenCalledTimes(1);
    expect(fakes.memory.record).not.toHaveBeenCalled();
    expect(fakes.users.incrementTokens).toHaveBeenCalledWith('u1', 8);
  });

  it('translate(): bills tokens for the caller', async () => {
    const answer = await chat.translate(ctx, 'Xin chào', 'vi', 'en');
    expect(answer).toBe('generated');
    expect(fakes.users.incrementTokens).toHaveBeenCalledWith('u1', 8);
  });
});
