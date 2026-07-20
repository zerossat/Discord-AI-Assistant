import { Buffer } from 'node:buffer';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Logger } from '../utils/logger';

export interface TtsServiceOptions {
  /** Gemini API keys (rotated on rate-limit for the Gemini voice). */
  apiKeys: string[];
  /** Gemini TTS model. */
  geminiModel?: string;
  logger?: Logger;
}

export interface TtsResult {
  buffer: Buffer;
  /** Container/extension of the produced audio. */
  ext: 'mp3' | 'wav';
}

/** Google Translate TTS caps each request at ~200 characters. */
const GOOGLE_TTS_MAX = 200;

/**
 * Text-to-speech provider. Supports two voices:
 *  - `google`: free Google Translate TTS (no key, robotic, reliable).
 *  - `gemini`: Gemini native TTS (reuses the Gemini key, more natural).
 */
export class TtsService {
  private readonly clients: GoogleGenAI[];
  private readonly geminiModel: string;
  private readonly logger?: Logger;

  constructor(options: TtsServiceOptions) {
    const keys = options.apiKeys.map((k) => k.trim()).filter((k) => k.length > 0);
    this.clients = keys.map((apiKey) => new GoogleGenAI({ apiKey }));
    this.geminiModel = options.geminiModel ?? 'gemini-2.5-flash-preview-tts';
    this.logger = options.logger;
  }

  /** Free Google Translate TTS. Chunks long text and concatenates the MP3 parts. */
  async google(text: string, lang = 'vi'): Promise<TtsResult> {
    const chunks = chunkText(text, GOOGLE_TTS_MAX);
    const parts: Buffer[] = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i]!;
      const url =
        'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob' +
        `&tl=${encodeURIComponent(lang)}&total=${chunks.length}&idx=${i}` +
        `&textlen=${chunk.length}&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`);
      parts.push(Buffer.from(await res.arrayBuffer()));
    }
    return { buffer: Buffer.concat(parts), ext: 'mp3' };
  }

  /** Gemini native TTS → WAV. Rotates through the keys on a 429. */
  async gemini(text: string, voiceName = 'Kore'): Promise<TtsResult> {
    if (this.clients.length === 0) {
      throw new Error('Gemini TTS cần GEMINI_API_KEY');
    }
    let lastError: unknown;
    for (const client of this.clients) {
      try {
        const res = await client.models.generateContent({
          model: this.geminiModel,
          contents: [{ role: 'user', parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
          },
        });
        const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        const data = part?.inlineData?.data;
        if (!data) throw new Error('Gemini không trả về dữ liệu âm thanh');
        const rate = parseRate(part?.inlineData?.mimeType) ?? 24000;
        const pcm = Buffer.from(data, 'base64');
        return { buffer: pcmToWav(pcm, rate, 1, 16), ext: 'wav' };
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        if (/429|RESOURCE_EXHAUSTED|Too Many Requests|quota|rate/i.test(message)) {
          this.logger?.warn({ err: message }, 'Gemini TTS key rate-limited; trying next key');
          continue;
        }
        throw err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Gemini TTS thất bại');
  }
}

/** Split text into ≤ `max`-char chunks on word boundaries. */
function chunkText(text: string, max: number): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > max) {
      if (current) chunks.push(current);
      current = word.length > max ? word.slice(0, max) : word;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text.slice(0, max)];
}

function parseRate(mime?: string): number | null {
  const match = mime?.match(/rate=(\d+)/);
  return match?.[1] ? Number(match[1]) : null;
}

/** Wrap raw little-endian PCM in a minimal 44-byte WAV header. */
function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bits: number): Buffer {
  const blockAlign = (channels * bits) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
