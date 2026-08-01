import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversationMessage } from '@daa/shared';
import { MemoryService } from '../services/memory.service';
import type { CacheService } from '../services/cache.service';
import type { ConversationRepository, NewConversationMessage } from '../database/repositories';

function createFakeCache() {
  const store = new Map<string, string>();
  return {
    store,
    getJSON: vi.fn(async (key: string) => {
      const raw = store.get(key);
      return raw ? (JSON.parse(raw) as unknown) : null;
    }),
    setJSON: vi.fn(async (key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    ping: vi.fn(async () => true),
  };
}

function createFakeConversations() {
  const store = new Map<string, ConversationMessage[]>();
  const k = (u: string, g: string | null) => `${u}:${g ?? 'dm'}`;
  return {
    store,
    getRecentMessages: vi.fn(async (u: string, g: string | null, limit: number) =>
      (store.get(k(u, g)) ?? []).slice(-limit),
    ),
    appendMessages: vi.fn(
      async (u: string, g: string | null, msgs: NewConversationMessage[], max: number) => {
        const current = store.get(k(u, g)) ?? [];
        const next = [
          ...current,
          ...msgs.map((m) => ({ ...m, createdAt: new Date().toISOString() })),
        ].slice(-max);
        store.set(k(u, g), next);
      },
    ),
    reset: vi.fn(async (u: string, g: string | null) => {
      store.set(k(u, g), []);
    }),
  };
}

describe('MemoryService', () => {
  let cache: ReturnType<typeof createFakeCache>;
  let conversations: ReturnType<typeof createFakeConversations>;
  let memory: MemoryService;

  beforeEach(() => {
    cache = createFakeCache();
    conversations = createFakeConversations();
    memory = new MemoryService(
      conversations as unknown as ConversationRepository,
      cache as unknown as CacheService,
      { maxMessages: 5, cacheTtlSeconds: 60 },
    );
  });

  it('reads from the DB on a cache miss and warms the cache', async () => {
    conversations.store.set('u1:g1', [
      { role: 'user', content: 'hi', createdAt: new Date().toISOString() },
    ]);

    const ctx = await memory.getContext('u1', 'g1');

    expect(ctx).toHaveLength(1);
    expect(conversations.getRecentMessages).toHaveBeenCalledTimes(1);
    expect(cache.setJSON).toHaveBeenCalledTimes(1);
  });

  it('serves a warm cache without touching the DB', async () => {
    conversations.store.set('u1:g1', [
      { role: 'user', content: 'hi', createdAt: new Date().toISOString() },
    ]);

    await memory.getContext('u1', 'g1'); // miss → warms cache
    await memory.getContext('u1', 'g1'); // hit

    expect(conversations.getRecentMessages).toHaveBeenCalledTimes(1);
  });

  it('persists new turns and invalidates the cache', async () => {
    await memory.record('u1', 'g1', [
      { role: 'user', content: 'question' },
      { role: 'model', content: 'answer' },
    ]);

    expect(conversations.appendMessages).toHaveBeenCalledTimes(1);
    expect(cache.del).toHaveBeenCalledWith('memory:g1:u1');
    expect(conversations.store.get('u1:g1')).toHaveLength(2);
  });

  it('caps the stored window at maxMessages', async () => {
    for (let i = 0; i < 8; i++) {
      await memory.record('u1', 'g1', [{ role: 'user', content: `m${i}` }]);
    }
    expect(conversations.store.get('u1:g1')!.length).toBeLessThanOrEqual(5);
  });

  it('reset clears both the DB and the cache', async () => {
    await memory.record('u1', null, [{ role: 'user', content: 'x' }]);
    await memory.reset('u1', null);
    expect(conversations.store.get('u1:dm')).toHaveLength(0);
    expect(cache.del).toHaveBeenCalledWith('memory:dm:u1');
  });
});
