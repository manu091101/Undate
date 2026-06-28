# Security Audit — Lumin Scaffold

> Audit by the `security-auditor` agent. OWASP Top 10 + OWASP LLM Top 10 + DPDP/PDPA/GDPR mapping. Fixes applied in this session are marked **FIXED**. Open items tagged with priority + Phase.

---

## CRITICAL (block deployment)

### S-C1. JWT/auth verification absent everywhere — open
- Zero `@UseGuards(...)`, no `JwtStrategy`, no passport module. Every endpoint added today inherits zero auth.
- **Phase 1 W3–4:** ship `JwtAuthGuard`, register globally via `APP_GUARD`, add `@Public()` opt-in for waitlist/health/OTP-start.

### S-C2. Socket.io ChatGateway is a public broadcast bus — **FIXED**
- CORS `origin: true` + no handshake auth + no `ConversationParticipant` lookup → anyone with a UUID could read/write any conversation.
- **Fix shipped:** gateway disabled in production; dev path enforces `authorize()` (token + conversation id) and CORS bound to `WEB_ORIGIN` allowlist.
- **Phase 1 W11:** ship real JWT verification + participant membership check + pre-broadcast safety classifier.

### S-C3. Refresh-token family-reuse detection modeled but unimplemented
- `AuthSession` has `refreshHash`, `family`, `revokedAt` — none used by code.
- **Phase 1 W4:** atomic rotate: insert-new + mark-old revoked; on present-but-revoked hash, revoke entire family.

### S-C4. `.env.example` mismatch with env validator — **FIXED**
- `.env.example` shipped `JWT_SECRET`; `env.ts` required `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET`.
- **Fix shipped:** rewrote `.env.example` to declare both secrets explicitly with `openssl rand -base64 64` generation instructions; added `GRAPHQL_INTROSPECTION_ENABLED` toggle.

### S-C5. JWT secret min 32 chars insufficient — **FIXED**
- HS256 + 30-day refresh window wants ≥ 64 chars.
- **Fix shipped:** raised `.min(64)` on both secrets in `apps/api/src/config/env.ts`.

### S-C6. GraphQL introspection gated only by `NODE_ENV` — **FIXED**
- A single misconfigured deploy would leak the schema.
- **Fix shipped:** explicit `GRAPHQL_INTROSPECTION_ENABLED=true` env required. Default `false` even when `NODE_ENV=development`.

### S-C7. No Content-Security-Policy header on web — **FIXED**
- AI narratives + bios render server-side without CSP.
- **Fix shipped:** strict CSP added to `apps/web/next.config.mjs` — `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, scoped img/connect sources to `cdn.lumin.ai` + `api.lumin.ai`.

---

## HIGH (must address before paying users)

| # | Issue | File | Status |
|---|---|---|---|
| S-H1 | Waitlist endpoint has no rate-limit / captcha / idempotency / enumeration defense | `apps/web/app/api/waitlist/route.ts` | OPEN — Phase 1: add Vercel edge throttle + Turnstile + identical response on existing email + `Idempotency-Key` |
| S-H2 | `ThrottlerModule` registered but never bound as a guard | `apps/api/src/app.module.ts` | **FIXED** — `APP_GUARD` wiring added with `ThrottlerGuard` |
| S-H3 | No anti-SMS-pumping on OTP path | `auth.service.ts` | OPEN — Phase 1: Twilio Verify + Fraud Guard + country allow-list + per-phone/per-IP throttle |
| S-H4 | CORS `origin: true` fallback fail-open | `main.ts` + `chat.gateway.ts` | **FIXED** — fail-closed: prod throws if WEB_ORIGIN unset |
| S-H5 | No Postgres row-level security on PII tables | `schema.prisma` | OPEN — Phase 1: RLS on `Profile`/`Message`/`PersonalityProfile`/`OnboardingResponse`/`AIInsight`/`Report` with `current_user_id()` GUC |
| S-H6 | `bioLong` (2000ch) flows into LLM prompt unguarded | `compatibility-narrative.ts` | **FIXED** — XML-tag fencing + NFKC + zero-width strip + control-char strip + length cap; system prompt explicitly tells model to treat tag contents as data |
| S-H7 | `Profile.sensitiveAttrs Bytes?` — no encryption code exists | `schema.prisma`, no crypto pkg | OPEN — Phase 1: `@lumin/crypto` with AWS KMS GenerateDataKey + AES-256-GCM |
| S-H8 | Religion/orientation/kink live unencrypted in `OnboardingResponse.answer` | `schema.prisma:303` | OPEN — Phase 1: tag sensitive question keys + route to envelope-encrypted store |
| S-H9 | Photos have no viewer-side signed URL machinery | `Photo.s3Key` | OPEN — Phase 1: `MediaResolver.signedUrl(photoId)` with match-membership check + CloudFront signed URL TTL ≤ 5min |
| S-H10 | No EXIF stripping in code or docs | upload pipeline | OPEN — Phase 1: server-side sharp `.withMetadata({})` after upload |
| S-H11 | `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` validated optional, throws at call time | `env.ts` | OPEN — Phase 1: required when `NODE_ENV=production` |
| S-H12 | No GDPR/DPDP deletion path | `User.deletedAt` exists, no pipeline | OPEN — Phase 1: `deleteUser(userId)` workflow + `DeletionRequest` table |
| S-H13 | `Report.evidenceUrls String[]` un-validated | `schema.prisma:634` | OPEN — Phase 1: validate URLs against `cdn.lumin.ai` allowlist |

---

## DPDP / PDPA / GDPR compliance gaps (open, Phase 1 priorities)

- **DPDP §6 consent** — no `Consent` model. Phase 1: capture itemized, versioned consents with timestamp + IP + one-tap withdrawal.
- **DPDP §8 Data Fiduciary** — DPO designation + grievance contact metadata. Phase 1.
- **DPDP §9 children** — 21+ floor is `dateOfBirth.refine(...)`, client-bypassable. Phase 1: ID verification at signup gates `UserStatus.ACTIVE`.
- **DPDP §11 right to erasure** — see S-H12.
- **DPDP §12 grievance redressal** — need `GrievanceRequest` table.
- **DPDP Rule 6 safeguards** — envelope encryption (S-H7), RLS (S-H5), access logging (open), breach pipeline (open).
- **GDPR Art 22 automated decisions** — Match narrative needs disclosure + curator-as-human-in-the-loop codified.
- **EU AI Act Art 50 (Aug 2026)** — `Message.aiAssisted` column exists; GraphQL resolver must expose it to recipients.
- **PDPA notification at collection** — onboarding questions need purpose-notice strings.
- **Data residency immutability** — `User.residencyRegion` comment says immutable but no enforcement. Phase 1: Prisma extension that rejects writes except on create.

---

## AI / LLM Top 10

- **LLM01 Prompt Injection** — **PARTIALLY FIXED**: `bioLong`/`voiceIntroTranscript` now wrapped in `<profile_facts>` tags, sanitized, length-capped. Phase 1: add multilingual jailbreak coverage + a post-generation audit pass with a cheaper model.
- **LLM02 Insecure output handling** — zod validates shape, not content. React escapes by default; ensure no `dangerouslySetInnerHTML` ever lands on `Match.aiNarrative`.
- **LLM05 Improper downstream handling** — narratives flow into push + email; sanitize per channel.
- **LLM06 Sensitive info disclosure / training leakage** — verify Anthropic + OpenAI zero-retention agreements in writing before any user PII flows.
- **LLM10 Unbounded consumption** — token budgets per user via existing `AIAgentSession.tokensUsed`. Phase 1.

---

## Safety regex — adversarial coverage

- **FIXED**: NFKC normalization + zero-width strip + character-separator collapse + leetspeak digit→letter variant + URL-shortener detection (`bit.ly`, `tinyurl`, `t.co`, `lnkd.in`, `wa.link`, etc.). 5 adversarial tests added.

### Remaining gaps (Phase 1 / Phase 2)

1. Multilingual scam vocab (Mandarin "投资", Hindi/Tamil scam patterns).
2. Word-to-digit phone numbers ("six five nine one two three").
3. Base64/ROT13 encoded payloads.
4. QR code image OCR (out-of-band; needs vision model on upload).
5. Resolved final hostname after following shorteners (HEAD-resolve pass).

---

## Verdict (from the audit, paraphrased)

> "Not safe for the 50-user Singapore alpha as written *at scaffold time*. The schema and architecture decisions are right; the code to honor them doesn't exist yet. After this session's fixes (S-C2, S-C4, S-C5, S-C6, S-C7, S-H2, S-H4, S-H6, plus safety regex hardening), the remaining critical blockers are S-C1 (global JWT guard), S-C3 (refresh rotation), S-H1 (waitlist throttle), S-H3 (SMS pumping), S-H7/H8 (envelope encryption), S-H9/H10 (signed URLs + EXIF), and S-H12 (deletion pipeline). All are concrete Phase 1 sprint items, not architectural rewrites. The schema is 80% right; the code is 5% there — but the code that exists is correct."

---

## Phase 1 security must-land checklist

Before the **first** Singapore alpha (50 users):

- [x] CORS fail-closed in prod
- [x] CSP header on web
- [x] GraphQL introspection explicit-opt-in
- [x] JWT secret min 64 chars enforced
- [x] ThrottlerGuard bound globally
- [x] Auth stubs guarded against production
- [x] Chat gateway disabled in prod
- [x] Safety regex hardened against homoglyphs / leetspeak / zero-width / shorteners
- [x] LLM prompt injection: XML-tag fenced + scrubbed inputs
- [ ] JwtAuthGuard implemented + bound as `APP_GUARD`
- [ ] Refresh-token rotation + family revocation
- [ ] Twilio Verify + Fraud Guard + country allow-list
- [ ] Waitlist edge throttle + Turnstile + idempotency key
- [ ] `@lumin/crypto` envelope encryption package
- [ ] Sensitive `OnboardingResponse.answer` routed to encrypted store
- [ ] Signed-URL photo serving + EXIF strip
- [ ] DPDP §11 deletion pipeline + 30-day SLA
- [ ] `Consent` + `GrievanceRequest` tables
- [ ] ID verification gate before `UserStatus.ACTIVE`
- [ ] Run `pnpm audit --audit-level=high` clean
