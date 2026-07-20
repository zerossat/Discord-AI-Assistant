import { z } from 'zod';

/**
 * Parse + validate environment variables against a Zod schema, throwing a
 * readable error (instead of a raw ZodError) when something is missing or
 * malformed. Used by both the bot and the dashboard.
 */
export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

/** Coerce common truthy/falsy string values into a boolean. */
export const booleanString = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === 'boolean'
      ? value
      : ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()),
  );

/** A port number that may arrive as a string from the environment. */
export const portString = z.coerce.number().int().min(1).max(65535);
