import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const parsed = EnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // Fail fast during dev/CI — easier to diagnose than running with bad config.
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment. See .env.example and your .env files.');
}

export const env = parsed.data;
export type Env = typeof env;
