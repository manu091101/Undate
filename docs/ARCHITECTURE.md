# Lumin — Architecture

## North star

Lumin produces **fewer, better matches**. The system is optimized for depth (rich psychological signal) over breadth (endless feeds). Every architectural choice should reinforce that.

## High-level system

```
                ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                │  web (Next)  │   │ admin (Next) │   │ mobile (Expo)│
                └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                       │                  │                   │
                       └─────── HTTPS / WSS ───────┐         │
                                                   ▼         ▼
                                    ┌──────────────────────────────────┐
                                    │      api (NestJS)                │
                                    │  GraphQL  •  REST  •  Socket.io  │
                                    └─┬───────────┬───────────┬────────┘
                                      │           │           │
                                      ▼           ▼           ▼
                            ┌──────────────┐ ┌────────┐ ┌──────────────┐
                            │ Postgres 16  │ │ Redis  │ │   S3 / CDN   │
                            │  + pgvector  │ │        │ │              │
                            └──────────────┘ └────────┘ └──────────────┘
                                      ▲
                              ┌───────┴───────┐
                              │  AI services  │
                              │ OpenAI/Claude │
                              └───────────────┘
```

## Bounded contexts

The API is a modular monolith. Each bounded context lives under `apps/api/src/modules/*` and owns its domain logic, types, and database access.

| Context | Owns | Talks to |
| --- | --- | --- |
| **auth** | Sessions, JWTs, phone OTP, refresh rotation | users |
| **users** | Account, identity, soft delete | auth, profiles |
| **profiles** | Public profile, photos, bio | users, moderation |
| **onboarding** | Multi-step questionnaire, personality scoring | profiles, ai |
| **matches** | Daily curation, match state machine, embeddings | profiles, ai |
| **conversations** | Threads, presence | matches, messages |
| **messages** | Sending, read receipts, moderation hooks | conversations, moderation |
| **subscriptions** | Tier, entitlements, renewal | payments |
| **payments** | Stripe wrapper, webhooks | subscriptions |
| **ai** | Provider abstraction, prompt orchestration, embedding | matches, onboarding |
| **moderation** | Reports, signals, decisions, audit log | messages, profiles |
| **notifications** | Push, email, in-app inbox | all |

## Data architecture

- **Postgres 16** is the system of record.
- **pgvector** stores two embeddings per profile: a 3072-dim semantic embedding (text-embedding-3-large) and a values vector for fast cosine match scoring.
- **Redis** is used for: session cache, presence, rate limiting, Socket.io adapter, lightweight job queue.
- **S3 / MinIO** stores photos and any user-uploaded media. CloudFront fronts S3 in prod.

## Match pipeline (simplified)

```
onboarding complete
       │
       ▼
personality scoring  ─► PersonalityProfile (Big Five + Undate facets)
       │
       ▼
embedding generation ─► Profile.profile_embedding, values_vector
       │
       ▼
nightly curation job ─► candidate set (kNN on pgvector + hard filters)
       │
       ▼
human curator review (admin app) ─► approved matches
       │
       ▼
match published     ─► AI compatibility narrative + icebreaker
       │
       ▼
user feedback loop  ─► MatchFeedback updates ranking weights
```

## Frontend architecture

- **web** and **admin** share `@lumin/ui` and `@lumin/config` (Tailwind preset, ESLint).
- **mobile** uses NativeWind so it can share Tailwind tokens with web.
- All clients consume a single typed GraphQL schema, generated from the API. Mutations that need realtime updates (chat, presence) use the Socket.io gateway.

## Security boundaries

- TLS terminated at the edge (CloudFront / ALB).
- All write endpoints require an authenticated session with CSRF protection for cookie-based flows.
- Photo uploads are presigned PUTs directly to S3; the API only sees metadata.
- PII columns (phone, email, location) are encrypted at rest via RDS KMS.
- Moderation is automatic-first (perspective-api style scoring on every message) and human-reviewed for severe signals.

## Deployment topology

- **web / admin** → Vercel (preview per PR, prod on `main`).
- **api** → AWS ECS Fargate behind ALB. Two tasks minimum, autoscaled on CPU + p95 latency.
- **mobile** → EAS Build (internal track) → TestFlight / Play Internal Testing.
- **Postgres** → RDS Aurora Postgres 16, multi-AZ in prod.
- **Redis** → ElastiCache Serverless.

## Why a modular monolith?

At our scale (target 50k MAU year one), splitting microservices early would cost engineering velocity without buying meaningful resilience. The bounded contexts above are designed so any one can be extracted later without rewriting callers.
