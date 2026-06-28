import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().optional(),
  // HS256 keys ought to be ≥ hash output (256 bits = 32 bytes). 64 chars gives
  // a real safety margin and matches RFC 7518 §3.2 guidance for long-lived
  // refresh tokens. Generate with `openssl rand -base64 64`.
  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  GRAPHQL_INTROSPECTION_ENABLED: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(raw);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment');
  }
  return result.data;
}
