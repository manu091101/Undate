/**
 * On Cloudflare the web app uses D1 (`apps/web/lib/d1.ts`).
 * This module must stay free of `@prisma/client` runtime imports so OpenNext
 * does not bundle native Prisma engines into the Worker.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = new Proxy(
  {},
  {
    get() {
      return () => {
        throw new Error(
          'Prisma is not available on Cloudflare Workers. Use apps/web/lib/d1.ts (D1).',
        );
      };
    },
  },
);
