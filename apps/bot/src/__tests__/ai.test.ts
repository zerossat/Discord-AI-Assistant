import { describe, expect, it } from 'vitest';
import { chunkMessage, estimateTokens } from '@daa/shared';
import {
  buildCodePrompt,
  buildSummaryPrompt,
  buildTranslatePrompt,
} from '../ai/prompts';

describe('shared text utils', () => {
  it('chunkMessage keeps short text as a single chunk', () => {
    expect(chunkMessage('hello')).toEqual(['hello']);
  });

  it('chunkMessage splits long text below the Discord limit', () => {
    const long = 'a\n'.repeat(2000); // 4000 chars
    const chunks = chunkMessage(long);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(2000);
    }
  });

  it('estimateTokens is positive and scales with length', () => {
    expect(estimateTokens('')).toBeGreaterThan(0);
    expect(estimateTokens('a'.repeat(40))).toBeGreaterThan(estimateTokens('a'));
  });
});

describe('prompt builders', () => {
  it('buildTranslatePrompt resolves language names', () => {
    const prompt = buildTranslatePrompt('Xin chào', 'vi', 'en');
    expect(prompt).toContain('Vietnamese');
    expect(prompt).toContain('English');
    expect(prompt).toContain('Xin chào');
  });

  it('buildTranslatePrompt handles auto source detection', () => {
    expect(buildTranslatePrompt('hi', 'auto', 'vi')).toContain('detected source language');
  });

  it('buildCodePrompt embeds the task', () => {
    expect(buildCodePrompt('make a CLI')).toContain('make a CLI');
  });

  it('buildSummaryPrompt includes the transcript and target language', () => {
    const prompt = buildSummaryPrompt(
      [
        { author: 'bob', content: 'hello' },
        { author: 'alice', content: 'hi' },
      ],
      'en',
    );
    expect(prompt).toContain('bob: hello');
    expect(prompt).toContain('alice: hi');
    expect(prompt).toContain('English');
  });
});
