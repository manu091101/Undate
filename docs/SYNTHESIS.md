# Lumin — Founding Synthesis

> Compiled from 5 parallel specialist research streams (market, UX, AI, security, backend) + initial product blueprint. Reconciles assumptions, names the gaps, and locks the Phase 1 plan.

---

## 0. What changed against the initial blueprint

The original "Lumin v0" pitch held up well, but the research forced **five hard course-corrections** the founding team should treat as durable:

| # | Initial assumption | Revised position | Source |
|---|---|---|---|
| 1 | "AI compatibility is the moat." | **Outcome-data flywheel + human curators are the moat. AI is the scale lever.** Joel/Eastwick 2020 (PNAS) showed similarity self-report explains <1% of relationship variance. | AI research |
| 2 | Voice + video intros at launch. | **Voice only at launch.** Highest-signal/lowest-anxiety medium, most differentiated. Video in v1.1 after we see completion rates. | UX research |
| 3 | Plus / Concierge / VIP all flow through one billing engine. | **Plus → IAP (forced); Concierge + VIP → web checkout / sales-call.** Saves ~30% on ~80% of revenue. Designate a "store compliance owner" role. | Market + backend |
| 4 | Cross-region matching (SG↔India) on by default. | **Off by default**, opt-in, surfaced as a top-tier feature. Avoids data-residency tangle + protects perceived locality. | Security + backend |
| 5 | UAE in the 2027 expansion plan. | **UAE pushed to 2028+**, gated on legal counsel. Federal Cybercrime Law 34/2021 makes premature launch a personal-liability risk for local staff. | Security |

These five corrections are the single most valuable output of this research cycle.

---

## 1. The Lumin thesis, re-anchored

**What Lumin sells:** the *absence* of swipe-app exhaustion, sold to people who pay for premium experiences in every other part of their life and have run out of patience for free ones in their love life.

**Why it works now (2026):**
- Hinge ARPPU at ~$340/yr is the ceiling for "mass-premium." The space between $30/mo (Hinge+) and $5,500+ (Tawkify / Three Day Rule / Lunch Actually) is essentially empty — that is Lumin's quadrant.
- Match Group's Q1–Q4 2024 Tinder payer decline (10.0M → 8.5M) created a durable narrative tailwind.
- LLMs in 2026 are finally cheap enough to do *grounded* compatibility narratives at scale (Sonnet 4.6 prompt-cached at ~$0.005 per narrative).
- India DPDP, Singapore PDPA, EU AI Act Article 50 (Aug 2026) all favour an *intentional, transparent, privacy-first* entrant against incumbents.

**Why the moat compounds:** every curator-approved match is a labeled training pair. Every post-match feedback ("did you meet? second date?") is delayed reward signal. Every cancellation reason is a model regularizer. None of this exists at Tinder/Bumble because their UX doesn't ask for it. After ~50k matches we have a ranker no competitor can clone in 12 months.

---

## 2. The empty quadrant — the single most important market insight

```
Price (USD/mo)
 5000 ┤                                            ◆ Tawkify, Three Day Rule, Lunch Actually
 1000 ┤                                            (real matchmakers, $5k–$50k packages)
  500 ┤                                            ▲ The League "Investor"
  300 ┤
  150 ┤                          ◀───────────────────────── Lumin Concierge ($99 / SGD $129)
  100 ┤                                                     Lumin VIP ($300 / qtr)
   60 ┤
   40 ┤                  ◆ Inner Circle
   30 ┤        ◆ Hinge, ◆ Bumble Premium+
   15 ┤  ◆ Tinder, ◆ Bumble Premium
    0 ┤  ◆ All free apps
       └────────────────────────────────────────────────────────────────────
        Mass  Premium  Curated  Concierge-tech  Human-matchmaker
```

Every other player either crowds the bottom-left (mass swipe apps) or sits in the top-right (human matchmakers). The **$80–$200/mo "concierge-tech" band** is empty in Singapore and India — Lumin's structural opportunity.

---

## 3. The revised pricing model (regional, locked)

| Tier | India (INR) | Singapore (SGD) | Global fallback (USD) | Distribution |
|---|---|---|---|---|
| **Free** | ₹0 | $0 | $0 | Funnel only · 1 match/week, no AI |
| **Plus** | ₹1,499/mo | $32/mo | $24/mo | **iOS/Android IAP** + web · matches Hinge+/Bumble Premium |
| **Concierge** | ₹6,999/mo | $129/mo | $99/mo | **Web checkout only** · empty-quadrant pricing · human curator + AI |
| **VIP** | ₹65,000/qtr | $1,199/qtr | $899/qtr | **Sales-call onboarding only** · dedicated matchmaker · ~1–2% of paying base |

Blended ARPPU target: **$650–$850/yr** (vs Hinge's ~$340).

Hard rule: never present Concierge/VIP CTAs inside the iOS app — Apple's anti-steering rules. Drive to "Continue on web" via a clean handoff with a mail-link.

---

## 4. The technical decisions locked from the research

These are not provisional; they go into the founding spec and require an ADR to change.

1. **Modular monolith in NestJS until 100k MAU.** Extract microservices only on concrete triggers (AI spend >$15k/mo → AI service; concurrent sockets >25k → Chat service; weekly batch >30k users → Match service).
2. **GraphQL primary, REST for webhooks + auth bootstrap.** Mobile uses persisted-query allowlist enforced server-side.
3. **Self-hosted Socket.io + Redis adapter from day 1.** Managed pub/sub (Ably/PubNub) is a pass-through given our AI moderation + entitlement-check requirements on every send.
4. **Build billing in-house.** Stripe + Razorpay + StoreKit 2 + Google Play Billing. Chargebee/Recurly choke on this trifecta. Revisit at $5M ARR.
5. **Region-isolated data residency from day 1.** India users → `ap-south-1` (Mumbai), Singapore → `ap-southeast-1`. India PII never crosses out. DPDP non-negotiable.
6. **OpenTelemetry + Grafana Cloud** for observability (~40% cheaper than Datadog at our projected scale).
7. **OpenFeature + Unleash** (self-host) for feature flags. LaunchDarkly at 1M MAU = $100–300k/yr; Unleash = ~$200/mo infra.
8. **Transactional outbox + idempotent webhooks from day 1.** Single highest-ROI reliability investment.
9. **Temporal for the weekly match workflow**, BullMQ for everything else.
10. **Persona (orchestrator) + HyperVerge (India Aadhaar/DigiLocker)** for identity verification. iProov Flashmark for high-tier liveness reinforcement.
11. **Anthropic Sonnet 4.6 primary, OpenAI GPT-4o fallback** for narrative generation. Llama-Guard-3 + Bedrock Guardrails for AI safety. Voyage-3-large primary embeddings, pgvector with HNSW.
12. **No autonomous AI mediator in v1.** Coach + icebreaker only. Composer is sacred. The trust risk of autonomous-send outweighs the value.

---

## 5. The 14 design decisions locked from UX research

1. Voice prompts at launch; video in v1.1.
2. **Sunday 7pm local time** weekly drop. Three profiles, sequentially revealed, no scroll-back. Pre-drop "your drop arrives tomorrow" notification 24h prior.
3. Match actions: **Pass with thanks** / **Save for later** / **Send an opener** — never "swipe yes/no."
4. One named **Concierge persona** with one voice. Never "Assistant." Never "AI."
5. **Sparkle (✦)** is the *only* AI affordance. Lavender `#B8A4D9`. Used in suggestion chips, "✦ Lumin-assisted" labels (EU AI Act Art 50, in force Aug 2026), and Concierge orb.
6. AI suggestion chips above the keyboard. **AI never auto-sends.** Composer is sacred.
7. **No user-facing metrics.** No likes-count, no profile views, no "viewed by N." Removes the dopamine vector that makes other apps grim.
8. **Snooze + graceful exit are first-class** top-level features, not buried in settings. Includes ghosting-prevention nudge ("It's been 5 days — want Lumin to send a graceful exit on your behalf?").
9. **No streaks. No "you haven't logged in!" Push limit: 2/week, ever.**
10. Crisis keyword detection routes private Concierge message with localised hotlines (Samaritans SG / iCall India).
11. **Tiempos Headline + Söhne** (Klim) typography. Avoid Editorial New (too "fashion") and Inter alone (too commodity).
12. Refined palette tokens: added `--ink-700`, `--cream-100`, `--gold-300` (better contrast), `--sparkle-500`. WCAG: gold-on-cream text needs `#8C7445` for AA.
13. **Multi-session resumable onboarding, capped at 6 min per session.** The 24–48h curator review is framed as part of the product, not a delay.
14. **Cross-region matching (SG↔India): opt-in, top-tier feature**, not a default.

---

## 6. Gap analysis — what nobody has told us yet

These are the holes the research cycle exposed that the team must close before launch.

### Strategic gaps
- **Curator economics.** We assume one curator handles ~200 paying members. We have no salary band, no India-vs-SG comp model, no quality-rubric, no curator-onboarding cost. Without this, gross margin math is hand-waved. **Owner: Head of Matchmaking (TBH).**
- **Cold-start in Singapore.** Below ~2,000 active members per metro the app feels empty (The League's stagnation is the warning). Founder-led acquisition strategy is sketched but no founder-dinner playbook, no PR cadence, no influencer shortlist exists. **Owner: CEO.**
- **The 21+ floor.** We recommend 21+ globally. Hinge starts at 18. We must validate whether 21+ in India shrinks the pool below liquidity threshold — needs a market-sizing call. **Owner: Head of Product.**
- **Counterfactual to weekly drop.** Sunday 7pm is opinionated. We have no A/B test plan to compare against Friday-evening or daily-drop variants. **Owner: Head of Product.**
- **Outcome-survey loop.** The entire ML thesis depends on us collecting "did you meet? second date? still dating in 90d?" data at >40% response rate. We have no UX flow for this yet and no incentive structure. **Owner: Head of Product + Design.**

### Product gaps
- **The "what is a Concierge actually doing?" spec.** We have the pricing and the promise. We don't have the workflow — does the Concierge spend 30 min/week per member or 10? What is the SLA? What is the script for the first call? **Owner: Head of Matchmaking.**
- **Match-feedback ergonomics.** Tawkify-style "date debrief" is in the moat thesis. We have schema (`MatchFeedback` table) but no UX flow, no nudge cadence, no anti-fatigue design. **Owner: Design.**
- **India-language strategy.** DPDP requires consent in 22 scheduled languages. We have `Locale` enum (en/hi/ta/zh/ms). We have **no actual translations**, no glossary for sensitive terms (attachment, kink, dealbreaker), no RTL plan if we eventually add Arabic. **Owner: Localisation lead (TBH).**
- **Voice-intro adversarial test set.** Voice is our differentiator and an obvious deepfake/scam vector. We have no synthetic-voice detection plan and no provider chosen. **Owner: Head of Trust & Safety.**

### Technical gaps
- **GraphQL N+1 strategy.** Apollo + Prisma is fast to ship and slow to scale if we're not disciplined. No DataLoader pattern decided, no field-level cache plan. **Owner: Founding eng.**
- **Mobile cold-start auth.** Clerk vs in-house is decided "Clerk MVP," but we have no Clerk Dedicated quote with India residency. If Clerk Dedicated requires a US contract, DPDP defensibility is shaky. **Owner: Founding eng + legal.**
- **WebSocket disconnect-recovery.** Socket.io at 15k+ sockets per task is OK; reconnect storms after a deploy will be brutal. No exponential-backoff client policy is specified. **Owner: Founding eng.**
- **Embedding model migration path.** We pick Voyage-3-large now. When (not if) we change embedding models in 18 months, every user embedding must be re-computed. No re-embedding workflow exists. **Owner: ML lead (TBH).**
- **Disaster recovery.** RTO 15m / RPO 5m is on paper. We have no DR drill calendar, no runbook. **Owner: DevOps lead (TBH).**

### Compliance gaps
- **DPDP Significant Data Fiduciary designation** — Lumin almost certainly qualifies. We must appoint an India DPO and budget for the audit ($30–80k/yr) *before* the SDF notice arrives, not after.
- **EU representative** — required if we have any EU residents. Need to scope (London-expat traffic alone will trip the threshold).
- **DPIA for the AI mediator + curator workflow** — needed by Q1 2027 at the latest. Budget legal + audit cost.
- **Cyber insurance** — need binder for $5M+ with sublimit for regulatory fines before opening to paying customers.

---

## 7. The five catastrophic-scenario stress tests (with on-call ownership)

Each must have a rehearsed runbook before public launch.

1. **Curator caught matchmaking for personal gain.** Detection: insider-anomaly alert. Response: immediate SCIM revoke, forensic image, HR + outside counsel, file police report on data exfiltration, DPB notification, transparency-report entry. *Designed mitigation: contact-graph check at curator assignment + 90-day rotation + DM-content masking by default.*
2. **Orientation-label leak (≥10k records).** Grindr precedent: $5.95M NPA fine + permanent brand damage. Response: rotate KMS DEK (crypto-shred backups), CloudTrail forensics, 72h notifications across all jurisdictions, free counseling partner (iCall SG/Samaritans IN), CEO video. *Designed mitigation: per-user envelope encryption on `sensitiveAttrs` (column already typed as `Bytes` in schema).*
3. **User murdered by a match.** Crisis cell, full litigation hold, dedicated family liaison, published LE guidelines. *Designed mitigation: mandatory pre-meet "share plan with two contacts," ID-verified-only filter on Concierge tier, 24/7 human T&S team.*
4. **AI mediator hallucinates a commitment.** ("I'd love to meet your parents next month") — emotional + potential legal. *Designed mitigation: no autonomous-send in v1; commitment-detector classifier on every AI output before display.*
5. **App Store delisting** (anti-steering violation or 1.1.4 hookup framing). Response: hot-config switch all tiers to IAP, file appeal, parallel web onboarding boost. *Designed mitigation: server-driven entitlement so client can switch billing path without re-release.*

---

## 8. Revised product roadmap (locked)

| Phase | Window | Owner | Exit criteria |
|---|---|---|---|
| **0 — Stealth** | M0–M2 | CEO | Brand, landing, waitlist live; 50 founder interviews completed; first 200 invites issued |
| **1 — Closed Alpha** | M2–M5 | CTO + CEO | Auth + onboarding + manual matches by founders + web chat + Stripe + iOS TestFlight; 100 active alpha users in SG |
| **2 — Curated Beta** | M5–M8 | CTO | AI compatibility v1 (cold-start curated by Concierge) + weekly drop ritual + Android + Mumbai cohort + Razorpay; 2,000 verified members across SG+IN |
| **3 — Scale Beta** | M8–M12 | Head of Product | AI coach + icebreakers + referral flywheel + identity verification + first VIP cohort; 15,000 verified members, $200k MRR |
| **4 — Series A & expansion** | M12–M18 | CEO | Bangalore + Delhi + Jakarta + (cautious) UAE legal scoping; Concierge tier 25% of paying base; $1M ARR |
| **5 — Platform** | M18–M30 | Head of Product | Events platform + date planning AI + ambassador program + enterprise/HR pilots; $5M ARR |

---

## 9. Phase 1 development plan (the next 90 days)

The scaffold is in place. What ships in Phase 1, in order:

### Week 1–2 — Foundation working
- `pnpm install` → docker compose up → Prisma migrate dev → seed → all four apps boot.
- CI green on lint + typecheck + build.
- Sentry + PostHog wired (web + API).
- Decide Clerk Dedicated vs SuperTokens self-host (single decision blocks auth).

### Week 3–4 — Waitlist live
- `apps/web` landing + `/waitlist` form → NestJS `POST /v1/waitlist` → WaitlistEntry row → confirmation email (Postmark) + referral code generated.
- Admin view (`apps/admin`) to triage waitlist + assign region.
- Brand site SEO + OG done. Launch-mode press list assembled.

### Week 5–6 — Auth + onboarding
- Phone OTP via Twilio Verify with Fraud Guard + country allow-list (SG, IN only initially).
- Passkey upgrade prompt.
- Multi-session resumable onboarding flow (Sessions 1, 2, 3 as defined in `packages/shared/src/onboarding.ts`).
- Voice prompt capture + Whisper transcript + waveform.
- Photo upload pipeline (presigned URL → S3 → Lambda transcode → CloudFront).

### Week 7–8 — Profile + curator queue
- Profile complete + review state.
- `apps/admin` curator queue: profile detail view, AI risk score, approve/reject/escalate flow.
- ConciergeNote workflow.
- DPDP-compliant consent flow with itemized purposes, withdrawal one tap.

### Week 9–10 — Matching v0 (manual + AI-assisted)
- Curator runs a "match draft" tool: pgvector top-50 candidates per user with hard filters applied + AI narrative pre-generated for approval.
- Curator approves 3 matches/user/week. They flow into `Match` table with `state = DELIVERED`.
- Member sees the weekly drop in `apps/web` (mobile parity in Phase 2).

### Week 11–12 — Chat + first real conversations
- Socket.io chat working in web app.
- AI icebreakers behind ✦ button (above keyboard).
- "✦ Lumin-assisted" disclosure on any AI-touched send (EU AI Act Art 50 ready).
- Report + block flows.
- Crisis keyword detection wired to private Concierge route.

### Week 13 — Stripe + Plus tier
- Stripe Checkout for Plus.
- Customer Portal for plan changes.
- Entitlement service enforces `matchesPerWeek` and `aiIcebreakers` from `TIER_ENTITLEMENTS`.
- First 100 paying members.

By end of Q1: 100 paying alpha members in Singapore, all infrastructure proven, ready to begin Phase 2 (mobile native + Razorpay + 2k beta members).

---

## 10. Hiring sequence to deliver this

| Week | Role | Why |
|---|---|---|
| 0 | CEO, CTO, Head of Design (founding 3) | Already in place |
| 1 | Founding full-stack eng #1 (TS/NestJS/Next/React) | Ships Phase 1 with CTO |
| 3 | Founding full-stack eng #2 | Parallel mobile + admin work |
| 4 | Brand designer (contract) | Brand system + landing polish |
| 6 | Head of Matchmaking (in Singapore) | Curator playbook + first 3 curator hires |
| 8 | ML engineer | Ranker + safety classifiers |
| 10 | AppSec engineer | DPDP audit prep + secure-by-default review |
| 12 | Head of Trust & Safety | 24/7 ops, reporting workflow, vendor relationships |
| 16 | Mobile lead (Expo/React Native) | Phase 2 mobile native |
| 18 | DevOps / SRE | Mumbai region, observability, on-call |

Founding eng profile: ex-CRED / Razorpay / Stripe SG / Grab / Sea — T-shaped, India/SG-based, has shipped to production at scale.

---

## 11. Open decisions for the CEO/CTO this week

1. **Auth path** — Clerk Dedicated (with India residency in writing) vs SuperTokens self-host. Cost vs control. *Recommendation: 30-min call with Clerk to confirm India residency; if not available, go SuperTokens.*
2. **Identity verification primary** — Persona (DX-friendly) vs Sumsub (AML-strong). *Recommendation: Persona + HyperVerge sub-vendor for India.*
3. **Brand naming sign-off** — "Lumin" trademark searches in IN/SG/US/EU. (Treat this as a blocker for the landing-page launch.)
4. **Founder dinners — first three venues + invite list.** Singapore: Atlas, Cloudstreet, Odette. Mumbai: Americano, The Bombay Canteen, Masque.
5. **Pre-seed close vs friends-and-family round.** $250k F&F can ship through M5; Pre-seed $1.5–2M unlocks the M6–M12 plan with confidence.
6. **21+ floor — hold or relax to 23+/25+ for VIP tier?** Test against waitlist demographics.

---

## 12. What this synthesis does not yet contain (honest accounting)

- **Live web-cited numbers.** Both WebSearch and WebFetch were denied for the research agents. Every figure is labelled `[reported]` (from training knowledge), `[estimated]`, or `[inference]` in the individual stream reports. **Before the pre-seed deck, re-run the market agent with web access.**
- **A Figma file.** The design tokens, palette, typography, motion specs, and 14 UX decisions are codified in writing. Translating them into a Figma library is the brand designer's first hire's job.
- **A complete investor deck.** The strategic narrative, pricing, moat, and pitch positioning are settled. Slide-craft is a separate sprint.
- **A formal financial model.** Per-MAU cost projections exist ($0.86 → $0.59 infra, $1.66 → $0.84 AI). Revenue + LTV/CAC + cohort retention model requires the alpha data.
- **A real legal review.** Every compliance claim above has a "verify with counsel before launch" footnote. Especially: DPDP SDF designation, India payment data residency, Apple/Google policy current text, UAE risk.

---

## Appendix — file index of this scaffold

```
/Users/manishkumar/Desktop/Matchmaking App/
├── apps/
│   ├── api/         NestJS modular monolith — GraphQL + Socket.io + 10 bounded contexts
│   ├── web/         Next.js 15 — marketing + waitlist + (auth shell)
│   ├── admin/       Next.js 15 — empty shell, Phase 1 W7–8
│   └── mobile/      Expo — empty shell, Phase 2
├── packages/
│   ├── db/          Prisma schema — 25+ models, pgvector, region routing
│   ├── shared/      Zod schemas + enums + design tokens + onboarding qs
│   ├── ui/          shadcn-style Button + Card + Sparkle (the AI icon)
│   ├── ai/          OpenAI + Anthropic + compatibility-narrative prompt + icebreaker
│   └── config/      ESLint flat config + Prettier + Tailwind preset + tsconfigs
├── infra/
│   └── docker/      compose.dev (pg+vector, redis, minio, mailpit) + Dockerfile.api
├── .github/workflows/  ci.yml + security.yml (gitleaks + pnpm audit)
└── docs/            ARCHITECTURE / CONTRIBUTING / SECURITY / ROADMAP / SYNTHESIS (this file)
```

The foundation is in place. Phase 1 starts on commit #1.
