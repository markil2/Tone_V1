import { z } from 'zod';

/**
 * Validated environment configuration.
 *
 * Parsed once at module load so a missing or malformed variable fails loudly at
 * startup rather than as a confusing `undefined` deep inside a network call.
 *
 * Only EXPO_PUBLIC_* variables are readable on the client, and they are embedded
 * in the shipped bundle — treat every value here as public. Secrets (the
 * Supabase service_role key, the Anthropic API key) belong in Edge Function
 * environment variables, never in this file.
 */

const schema = z.object({
  supabaseUrl: z.url({ error: 'EXPO_PUBLIC_SUPABASE_URL must be a valid URL' }),
  supabaseAnonKey: z
    .string()
    .min(1, { error: 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required' }),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.message}`).join('\n');
  throw new Error(
    `Invalid environment configuration:\n${issues}\n\n` +
      'Copy .env.example to .env and fill in your Supabase project values.',
  );
}

export const env: Env = parsed.data;
