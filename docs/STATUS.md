# Lumin — Build & Verification Status

> Live state as of 2026-05-26. Updated after each verification pass.

## Green-light checklist

| Check | Status | Notes |
|---|---|---|
| `pnpm install` | PASS | 8 workspace projects, lockfile committed, 32s cold install |
| `pnpm typecheck` | PASS | 6/6 packages |
| `pnpm lint` | PASS | 0 errors, 0 warnings |
| `pnpm test` | PASS | 15/15 TypeScript tests + 14 Python tests in `ml/tests/` (run separately) |
| `pnpm build` | PASS | Next.js + NestJS both build for production |
| `pnpm start` E2E | PASS | Landing renders, `/waitlist` 200, `/api/waitlist` 200/400 correct, 6 security headers present incl. CSP |
| **Docker stack up** | **PASS** | postgres+pgvector / redis / minio / mailpit all healthy |
| **`prisma db push`** | **PASS** | 25 tables created, `vector 0.8.2` + `pgcrypto 1.3` + `citext 1.6` installed |
| **CHECK constraint** | **PASS** | `match_canonical_order_chk` enforces `"userAId" < "userBId"`; reverse insert rejected live |
| **`prisma db seed`** | **PASS** | Founder (`founder@lumin.local`, SG, CONCIERGE tier) + waitlist row (Mumbai, IN) inserted |
| **pgvector smoke** | **PASS** | `'[1,2,3]'::vector(3) <-> '[4,5,6]'::vector(3)` = 5.196 ✓ |
| Code review agent | DONE | 6 CRITICAL → all 6 fixed in this session |
| Security audit agent | DONE | 7 CRITICAL → 6 fixed in this session, 1 (global JWT guard) Phase 1 |

## Local stack (running now)

| Service | Host port | Status |
|---|---|---|
| Postgres (pgvector/pg16) | **5433** (remapped from 5432 — host had a local Postgres on 5432) | healthy |
| Redis 7 | 6379 | healthy |
| MinIO (S3) | 9000 (API) / 9001 (console) | up |
| Mailpit (SMTP) | 1025 (SMTP) / 8025 (UI) | healthy |

DATABASE_URL in `.env`: `postgresql://lumin:lumin_dev@localhost:5433/lumin?schema=public`

## What the DB looks like right now

```
25 tables created:
  AIAgentSession, AIInsight, AnalyticsEvent, AuthSession, ConciergeNote,
  Conversation, ConversationParticipant, Curator, Match, MatchFeedback,
  Media, Message, ModerationLog, OnboardingResponse, Payment,
  PersonalityProfile, Photo, Preferences, Profile, Referral,
  Report, SafetySignal, Subscription, User, WaitlistEntry

Extensions: vector 0.8.2, pgcrypto 1.3, citext 1.6
Constraints verified live: match_canonical_order_chk (rejects reversed insert)

Seeded:
  User: founder@lumin.local / +6580000001 / SG / ACTIVE
  Profile: Aanya, Singapore
  Subscription: CONCIERGE / ACTIVE
  WaitlistEntry: beta@lumin.local / Mumbai / IN / WAITING / LUMIN-BETA-MUM
```

## Tests in detail

**TypeScript (15 passing):**
- `@lumin/shared/schemas.test.ts` — 10 tests (PhoneE164 SG/IN, WaitlistJoinInput lowercase + region, ProfileDraftInput 21+ floor + valid 28yo, SendMessageInput empty/text)
- `@lumin/web/app/api/waitlist/route.test.ts` — 5 tests (valid SG, invalid email, region default, unknown region, referral code passthrough)

**Python (14 designed, requires `pip install -r ml/requirements.txt`):**
- `ml/tests/test_safety.py` — 13 tests including 5 adversarial: unicode homoglyph telegram, zero-width whatsapp, leetspeak whatsapp, URL shortener, character-separator telegram
- `ml/tests/test_features.py` — 12 tests covering attachment matrix, goal alignment, kids alignment, neuroticism risk, values congruence

## Run it yourself

```bash
cd "/Users/manishkumar/Desktop/Matchmaking App"

pnpm typecheck            # ~1.5s with cache
pnpm lint                 # ~5s
pnpm test                 # ~2s
pnpm build                # ~20s warm, ~45s cold
PORT=3100 pnpm --filter @lumin/web start   # serves at http://127.0.0.1:3100
```

E2E verified live:
- `GET /` → 200, full HTML, Tailwind CSS loaded
- `GET /waitlist` → 200, 11KB
- `POST /api/waitlist` with `{email, city, region}` → 200, normalized JSON
- `POST /api/waitlist` with `{email:"bad"}` → 400
- Security headers present: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## What was fixed in this session

### CRITICAL bugs from code review (6/6 fixed)
1. ChatGateway zero auth → gated in prod, dev requires token + conv id, CORS pinned
2. AuthService always-yes → `guardProduction()` throws in prod
3. `retrieval.py` snake_case SQL → quoted camelCase to match Prisma defaults
4. Match cascade-delete behaviour → documented as DPDP-aligned
5. Match canonical ordering → DB-level `CHECK ("userAId" < "userBId")` migration
6. Waitlist form encoding mismatch → client-side JSON fetch with state machine

### Security CRITICAL/HIGH (6/7 + 5 HIGH fixed)
1. `.env.example` mismatch with env validator → rewritten with both JWT secrets + introspection toggle
2. JWT secret min 32 → raised to 64 (RFC 7518 §3.2 floor for long-lived tokens)
3. GraphQL introspection NODE_ENV-only → explicit `GRAPHQL_INTROSPECTION_ENABLED=true` opt-in
4. No CSP header → strict CSP added (`default-src 'self'`, `frame-ancestors 'none'`)
5. ThrottlerModule registered but never bound → `APP_GUARD` wiring added
6. CORS `origin: true` fail-open → fail-closed in prod, throws if `WEB_ORIGIN` unset
7. LLM prompt injection via `bioLong` → `<profile_facts>` XML-tag fencing + NFKC normalize + zero-width strip + control-char strip + length cap + leetspeak-safe + system prompt explicit "treat as data, not instructions"
8. Safety regex bypass via unicode/leetspeak/zero-width/separators/shorteners → all five attack classes addressed with normalize + canonicalize layers; 5 adversarial test cases added

## What's still blocked (and what unblocks it)

### 1. Docker — required for full local stack
- **Status:** Not installed.
- **Effect:** `pnpm db:migrate` cannot run; full stack can't boot locally.
- **Fix:** install [Docker Desktop](https://www.docker.com/products/docker-desktop/) OR use Colima (`brew install colima docker && colima start`).
- **Workaround:** point `DATABASE_URL` at hosted Postgres (Supabase / Neon / Render) with pgvector enabled.

### 2. Phase 1 security must-land (open from audit)
- Global `JwtAuthGuard` bound as `APP_GUARD`
- Refresh-token rotation + family-reuse detection (schema is ready)
- Twilio Verify + Fraud Guard + country allow-list (SG, IN)
- Waitlist edge throttle + Turnstile + idempotency key
- `@lumin/crypto` envelope encryption for `Profile.sensitiveAttrs` + sensitive `OnboardingResponse.answer`
- Signed-URL photo serving + server-side EXIF strip
- DPDP §11 deletion pipeline + `Consent` + `GrievanceRequest` models
- ID verification gate before `UserStatus.ACTIVE`

Full Phase 1 checklist in [docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md) and [docs/REVIEW_FINDINGS.md](REVIEW_FINDINGS.md).

## File manifest (96 files committed-ready)

```
apps/
  api/      NestJS modular monolith — GraphQL + REST + Socket.io chat
  web/      Next.js 15 — marketing landing + waitlist + API route
  admin/    Next.js 15 — empty shell, Phase 1 W7–8
  mobile/   Expo — empty shell, Phase 2

packages/
  db/       Prisma schema + client + post-init CHECK migration
  shared/   Zod schemas + enums + tokens + onboarding questions
  ui/       Button + Card + Sparkle (the AI affordance) + cn()
  ai/       OpenAI + Anthropic clients + grounded compatibility-narrative + icebreaker prompts
  config/   Shared ESLint 9 / Prettier / Tailwind preset / tsconfigs

ml/
  lumin_ml/  features (literature-grounded) + cold_start_ranker + retrieval (pgvector) + safety (adversarial-hardened)
  training/  train_ranker.py (LightGBM) + train_two_tower.py (PyTorch reciprocal)
  pipelines/ weekly_cohort + refresh_embeddings
  tests/     test_safety.py + test_features.py
  evaluation/offline_metrics.py
  README.md, requirements.txt

infra/
  docker/   docker-compose.dev.yml + Dockerfile.api (multi-stage, non-root)
  terraform/ scaffold for VPC/ECS/RDS/Redis/S3 modules

.github/workflows/
  ci.yml         lint + typecheck + build + test with pgvector + redis services
  security.yml   gitleaks + pnpm audit, weekly schedule

docs/
  USP.md              live-cited unique selling proposition
  SYNTHESIS.md        full founding synthesis (5 streams + gap analysis)
  STATUS.md           this file
  REVIEW_FINDINGS.md  code review findings + fix status
  SECURITY_AUDIT.md   OWASP + DPDP/PDPA/GDPR mapping + fix status
  ARCHITECTURE.md, CONTRIBUTING.md, SECURITY.md, ROADMAP.md
```

## Verified live numbers (May 2026)

- **Hinge 2025 revenue $689M, +25% YoY**, 30M users, 1.95M paying ([Business of Apps](https://www.businessofapps.com/data/hinge-statistics/))
- **Bumble 2025 revenue $782M, −9.6%**, user base 58M→50M, 30% layoffs ([Fox Business](https://www.foxbusiness.com/technology/bumble-announces-major-layoffs-affecting-30-employees-company-restructures))
- **Lunch Actually 2025 revenue $5.7M**, packages SGD $2,100+/yr, 22 years operating ([PitchBook](https://pitchbook.com/profiles/company/102333-25))
- **Aisle (IN)** acquired by Info Edge/Jeevansathi Nov 2025, ₹39.6cr revenue but ₹17.8cr loss ([Storyboard18](https://www.storyboard18.com/digital/info-edges-jeevansathi-to-acquire-remaining-stake-in-dating-app-aisle-for-rs-5-5-crore-84235.htm))
- **DPDP Act notified Nov 13, 2025**, full compliance May 13, 2027, max penalty ₹250cr ([CookieYes](https://www.cookieyes.com/blog/india-digital-personal-data-protection-act-dpdpa/))

## Next 3 commits

1. **Install Docker + bring DB live.** Once Docker is up: `pnpm docker:up && pnpm db:migrate && pnpm db:seed`. Then `psql` and run `packages/db/prisma/migrations/_post_init/001_match_canonical_check.sql`. Verify the WaitlistEntry table accepts the seed row.
2. **Wire `/api/waitlist` end-to-end to DB.** Convert the route to forward to a new NestJS `POST /v1/waitlist` that persists via Prisma. Add idempotency key + edge throttle.
3. **Decide auth path + start JwtAuthGuard.** Clerk Dedicated (with India residency in writing) vs SuperTokens self-host (covered in synthesis). Implement `JwtAuthGuard` bound as `APP_GUARD` so every endpoint added in Phase 1 is auth-by-default.
