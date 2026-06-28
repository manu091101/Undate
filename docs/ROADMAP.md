# Lumin — Roadmap

A five-phase plan from waitlist to flagship. Dates are deliberately omitted; phases progress when the work and the data say they should.

## Phase 1 — Foundation & Waitlist

Goal: prove the brand, build the team, ship the spine.

- Marketing site live with waitlist capture and referral codes.
- Monorepo, CI, observability, environments wired end-to-end.
- Auth: phone OTP via Twilio, refresh-token rotation.
- Database schema v1 (this repo's `packages/db/prisma/schema.prisma`).
- Internal admin app with curator login.
- Brand and design system shipped (`@lumin/ui`).

Exit criteria: 5,000 waitlist signups with > 30 % referral-driven, founding curators onboarded.

## Phase 2 — Closed Alpha (Concierge)

Goal: every match human-curated, every member personally onboarded.

- Member onboarding flow (web + mobile): identity, photos, prompts, values, personality questionnaire.
- Personality scoring pipeline (Big Five + Lumin facets).
- Profile embedding generation (text-embedding-3-large).
- Curator workflow: candidate review, narrative review, publish.
- One-to-one chat (Socket.io) with read receipts and presence.
- Automated message moderation (toxicity + safety signals).
- Stripe subscriptions (Intro tier).
- Postmark/Resend transactional email.
- Sentry + PostHog wired.

Exit criteria: 100 active members across two metros, > 50 % first-match acceptance, < 2 % weekly churn.

## Phase 3 — Open Alpha

Goal: scale curation without losing taste.

- Hybrid curation: AI-shortlisted top-K candidates, curator approves/edits, member sees one match per day.
- AI-authored compatibility narrative reviewed by curator before send.
- Icebreaker generation per match.
- Match feedback loop adjusting ranking weights per member.
- Signature tier (richer profile, priority curation).
- iOS and Android in TestFlight / Play Internal.
- Trust & safety: reports queue, automated decisions for high-confidence signals.

Exit criteria: 1,000 active members, NPS > 50, curator throughput > 80 matches / curator / day.

## Phase 4 — Public Beta

Goal: open the door, hold the standard.

- Public iOS and Android launch.
- Referral economy: every member gets N invites, invitees skip the waitlist.
- Video Vibes: optional 15-second prompt responses.
- Couples retrospective: invite-only post-relationship survey to feed learning.
- Concierge tier with human matchmaker.
- Internationalization scaffolding (en, es, fr).

Exit criteria: 25,000 MAU, > 60 % D30 retention for paying members.

## Phase 5 — Flagship

Goal: become the reference for considered dating.

- Multi-city expansion playbook (NYC, LA, SF, London, Toronto).
- Events platform: curated in-person dinners for Signature+ members.
- Lumin Index: anonymized annual report on what makes modern relationships work.
- Couples mode (long-term relationship maintenance, opt-in).
- B2B partnerships with therapists, coaches, and venues.

Exit criteria: profitability on Signature tier, > 200k MAU, top-5 App Store dating app by rating.

---

### Things we will not build (deliberately)

- Infinite-scroll feeds.
- "Like" or "super-like" mechanics.
- Public visible counts (matches, likes, etc.).
- Ad-supported tiers.
- Sponsored profiles.

These omissions are features.
