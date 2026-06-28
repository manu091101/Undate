import { PrismaClient } from '@prisma/client';

declare global {
  // Allow a process-wide singleton in dev to survive hot-reload.

  var __luminPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__luminPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__luminPrisma = prisma;
}

export * from '@prisma/client';
export type { PrismaClient } from '@prisma/client';
