import { DISCORD_MESSAGE_LIMIT } from './constants';

/**
 * Split a long string into Discord-sized chunks (<= 2000 chars), trying to
 * break on newlines / code-fence boundaries rather than mid-line.
 */
export function chunkMessage(text: string, limit = DISCORD_MESSAGE_LIMIT): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    let slice = remaining.slice(0, limit);
    const lastNewline = slice.lastIndexOf('\n');
    // Prefer to cut on a newline if one exists reasonably far into the slice.
    if (lastNewline > limit * 0.5) {
      slice = slice.slice(0, lastNewline);
    }
    chunks.push(slice);
    remaining = remaining.slice(slice.length);
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/** Truncate a string to `max` characters, appending an ellipsis when cut. */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;
}

/** Rough heuristic token estimate (~4 chars/token) for usage accounting. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Sleep helper for retry/backoff logic. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
