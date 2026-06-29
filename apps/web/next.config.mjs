/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

// CSP. Production is strict. Dev relaxes script-src to allow Next.js Turbopack's
// inline hydration bootstrap + eval (which the dev runtime uses for HMR).
// When we move to a nonce-based CSP via middleware, the dev branch goes away.
const csp = [
  "default-src 'self'",
  // Next.js App Router injects inline bootstrap/flight scripts. Without
  // 'unsafe-inline' (or a per-request nonce) the browser blocks them and React
  // 19 hydration wipes the server HTML → blank page. Allow inline in both
  // environments; a nonce-based CSP via middleware is the future hardening.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.lumin.ai https://images.unsplash.com https://i.pravatar.cc https://images.pexels.com https://randomuser.me",
  "font-src 'self' data:",
  isDev
    ? "connect-src 'self' ws: wss: http://localhost:* https://api.lumin.ai wss://api.lumin.ai"
    : "connect-src 'self' https://api.lumin.ai wss://api.lumin.ai",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@lumin/ui', '@lumin/shared', '@lumin/db', '@lumin/ai'],
  serverExternalPackages: ['@prisma/client', '@anthropic-ai/sdk', 'openai'],
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.lumin.ai' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};
export default nextConfig;
