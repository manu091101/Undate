# Undate

> Intentional, agentic matchmaking — where calm, considered relationships begin.

Undate pairs deep psychological profiling with hand-curated introductions. It is not a swiping app — it's the antithesis of one. Instead of an endless feed, your **AI agent runs the matchmaking for you**: it learns who you are through a natural conversation, runs high-speed "mock dates" against the pool, and surfaces a small set of people genuinely worth meeting — then the humans take over.

This repository is the Undate monorepo: web, admin, mobile, API, shared packages, and infrastructure.

---

## What makes Undate different

- **Conversational onboarding** — no forms. Members meet an AI matchmaker by **text chat or a voice interview**, and the system *implicitly infers* their personality (no clinical surveys).
- **What it measures** — Big Five (OCEAN), a Myers-Briggs mapping, attachment style, a 10-dimension Schwartz values model, conversation style, relationship intentions & children, plus subtle evidence traits (humour, expressiveness, decisiveness, novelty-seeking).
- **The Agentic Matching Ring** — each member becomes a structured agent persona. A literature-grounded compatibility algorithm ranks the pool, agents run simulated mock dates, and the best matches are surfaced with a debrief of *why your agents clicked*.
- **Gated, curated community** — a waitlist + admin approval flow keeps the community small and trustworthy.
- **Hybrid AI** — live Claude when an `ANTHROPIC_API_KEY` is set; a deterministic fallback otherwise, so everything works offline and at zero cost.

See [docs/PERSONALITY_MATCHING.md](./docs/PERSONALITY_MATCHING.md) for the research basis.

---

## Quick start (local)

```bash
# 1. Install Node 20+ and pnpm 9
corepack enable && corepack prepare pnpm@9.12.3 --activate

# 2. Install dependencies
pnpm install

# 3. Bring up local Postgres (pgvector) + Redis
pnpm docker:up
#   The dev Postgres listens on host port 5433. Point DATABASE_URL at it:
#   DATABASE_URL="postgresql://lumin:lumin_dev@localhost:5433/lumin?schema=public"

# 4. Generate the Prisma client, push the schema, seed demo data
pnpm db:generate
pnpm --filter @lumin/db exec prisma db push
pnpm db:seed

# 5. Run the web app (http://localhost:3000)
pnpm --filter @lumin/web dev
```

Demo accounts (all share the password `undate-demo-2026`): `founder@undate.local` is the **admin** (open `/admin`); `priya@undate.local` and nine others are active members. Drop a logo at `apps/web/public/undate-logo.png` (the app falls back to an "Undate" wordmark otherwise).

Stop local services: `pnpm docker:down`.

---

## Monorepo layout

```
apps/
  web/      Next.js 15 — marketing site + member experience + admin + APIs
  admin/    (legacy shell — admin now lives under apps/web/app/admin)
  mobile/   Expo (React Native) — iOS + Android members app
  api/      NestJS modular monolith — GraphQL + REST + Socket.io

packages/
  db/       Prisma schema, generated client, migrations, seed
  shared/   Domain types, Zod schemas, enums, the matching algorithm
  ui/       Shared design-system components
  config/   ESLint, Prettier, Tailwind, TypeScript shared configs
  ai/       Anthropic/OpenAI wrappers + prompt modules (onboarding coach,
            personality inference, agentic mock-date simulation)

infra/      docker compose (dev) + Terraform (AWS) + Dockerfiles
ml/         Python feature/ranker pipelines (future LightGBM/two-tower)
```

---

## Key flows & endpoints (web)

| Area | Path |
| --- | --- |
| Onboarding chooser / chat / voice | `/onboarding`, `/onboarding/chat`, `/onboarding/voice` |
| Inference + persistence | `POST /api/onboarding/chat`, `POST /api/onboarding/finalize` |
| Waitlist + admin approval | `/waitlist`, `/admin`, `POST /api/admin/waitlist/:id/invite`, `POST /api/admin/users/:id/activate` |
| Matching algorithm | `packages/shared/src/matching.ts` |
| Agentic matching ring | `POST /api/matches/agentic` |
| Photo upload | `POST /api/photos/upload` |

---

## Common commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run every app in dev mode (turbo) |
| `pnpm build` | Build every package & app |
| `pnpm lint` / `pnpm typecheck` | Lint / TypeScript checks |
| `pnpm db:seed` | Seed dev database |
| `pnpm docker:up` / `pnpm docker:down` | Local Postgres (pgvector) + Redis |

---

## Tech stack

TypeScript (strict) · Next.js 15 (App Router) + React 19 + Tailwind · NestJS API · PostgreSQL 16 + pgvector · Anthropic Claude + OpenAI embeddings · Expo (mobile) · Turborepo · Docker.

---

## License

Proprietary. © Undate. All rights reserved.
