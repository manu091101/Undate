# Undate on Cloudflare (Workers + D1 + static assets)

Production: **https://undateapp.com**

## Stack
- **Workers** (`src/index.ts`, Hono) — SSR pages + JSON APIs
- **D1** (`undate`) — waitlist, users, matches
- **Assets** (`public/`) — CSS (Pages-style static binding on Workers)

## Commands
```bash
cd apps/cf
npm install --legacy-peer-deps
npm test
npm run db:remote   # apply migrations
npx wrangler secret put JWT_SECRET
npm run deploy
```

## Demo accounts
Password for all: `undate-demo-2026`
- `founder@undate.local` (admin)
- `priya@undate.local`, `james@undate.local`, …

## Branch
All CF rewrite work lives on `cloudflare-pages-d1` (not `main`).
