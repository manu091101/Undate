# Lumin MVP — Recording Script

> What's recordable today: brand landing, premium waitlist flow with live DB round-trip, design system, security headers, and the founding documents. Estimated runtime: **5–8 minutes** for a tight take, 12–15 if you narrate architecture.

---

## Before you hit record

The dev server is already running. If it isn't, here's how to bring everything up cleanly:

```bash
cd "/Users/manishkumar/Desktop/Matchmaking App"

# Stack (only needed if you stopped Docker)
pnpm docker:up

# Dev server (open in a new terminal so you can see logs)
pnpm --filter @lumin/web dev
```

**Open:**
- Browser tab 1: <http://localhost:3000>
- Browser tab 2 (optional, for the dev-tools shot): <http://localhost:3000/waitlist>
- Terminal split: keep `psql` ready (command below).

**Window setup tip:** put your browser at ~1280×800. Lumin's design is built for that grid. Avoid the iPhone simulator — the mobile app is a Phase 2 shell.

---

## Scene 1 — The landing page (60–90 seconds)

**Open:** <http://localhost:3000>

**What to say:**
- "This is Lumin. A premium AI matchmaking platform built for educated professionals in Singapore and India who are done with swipe apps."
- "Dark by default — most dating-app usage is 8pm to midnight. The cream/ink/gold palette is calibrated to feel like Linear and Arc, not Tinder."

**What to show with the cursor:**
- The "Private beta · Singapore + India" chip (top of hero) — *this signals exclusivity*.
- The hero serif headline (Tiempos Headline / Editorial New).
- Hover over **"Request your invitation"** — the gold accent button (`--gold-500 #C7A971`).
- The three benefit cards (Hand curated / Three a week / Private by design) — the brand thesis.
- Footer: "Singapore + Mumbai" — geographic positioning.

**Hidden detail to call out:** the page is statically prerendered (166 B route size in build output). First Load JS is ~105 kB total. Tight bundle.

---

## Scene 2 — The waitlist flow (60–90 seconds)

**Click:** "Request your invitation" → routes to `/waitlist`

**What to say:**
- "The waitlist is a real product, not a stub. It validates input on the client and server using the same Zod schema, then writes to Postgres."
- "Notice we're asking for region. Lumin is data-residency-isolated from day one — India users' data stays in our Mumbai region, Singapore in Singapore. DPDP compliance is built in, not retrofitted."

**Form fill:**
- Email: your real email or `demo@your-domain.com`
- City: `Singapore`
- Region: leave on `Singapore`
- Skip referral code

**Click:** Send my request

**Expected:** "Thank you." success screen with the serif headline.

---

## Scene 3 — The live database round-trip (60 seconds)

**Switch to terminal. Run:**

```bash
docker exec lumin-dev-postgres-1 psql -U lumin -d lumin -c \
  'SELECT email, city, region, "referralCode", status, "createdAt" FROM "WaitlistEntry" ORDER BY "createdAt" DESC LIMIT 5;'
```

**What you'll see:** the row you just submitted, with a freshly generated `LUMIN-XXXXXXXX` referral code, timestamped, status `WAITING`.

**What to say:**
- "End-to-end. Browser hits a Next.js Route Handler, runs through the shared Zod schema, lands in Postgres via Prisma. The referral code is generated server-side and is what powers the waitlist flywheel."
- "Notice — these are real columns, real types, on a real schema with 25 tables already migrated. Match, Conversation, Subscription, AIInsight, the whole domain. Not stubs."

---

## Scene 4 — The security headers (30 seconds)

**In the browser, open DevTools → Network → click the document for `/`.**

Show the Response Headers:
- `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; …`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**What to say:**
- "Six security headers on every response, including a real CSP. This is what shipping for the DPDP regime looks like — penalties up to ₹250 crore mean you build it in on day one, not in a Series A clean-up sprint."

---

## Scene 5 — The architecture (90 seconds, optional)

**Open the editor.** Show:

1. **`packages/db/prisma/schema.prisma`** — scroll through the 25 models. Stop on `Match`. Point out:
   - `compatibilityScore`, `scoreBreakdown JSONB`, `aiNarrative`, `curatorId` — AI + human in the loop.
   - `Profile.profileEmbedding Unsupported("vector(3072)")` — pgvector embedding for the matchmaking engine.
   - `Profile.sensitiveAttrs Bytes?` — envelope-encrypted at the app layer (orientation, religion, dealbreakers never stored plaintext).

2. **`packages/ai/src/prompts/compatibility-narrative.ts`** — point at the `SYSTEM` prompt and the `scrub()` + `<profile_facts>` XML tag fencing.
   - "Prompt injection via profile bio is one of the OWASP LLM Top 10. We tag user content, NFKC-normalize, strip zero-width chars, hard-cap length, and tell the model explicitly to treat tag contents as data, not instructions."

3. **`ml/lumin_ml/features.py`** — show the literature citations.
   - "We don't pretend AI can predict love. The peer-reviewed research — Joel & Eastwick 2020 — shows pre-meeting similarity self-report explains under one percent of relationship variance. So we build the model around what *does* matter: attachment style fit, hard goal alignment, values congruence, with curator judgment on top. Honest, not magic."

---

## Scene 6 — The strategy docs (60 seconds, optional but high-signal for investors)

**Open in the editor and scroll briefly:**

- **`docs/USP.md`** — live-cited 2026 numbers: Hinge $689M (+25%), Bumble −9.6%, Aisle loss-making, Lunch Actually's $5.7M proof of willingness-to-pay.
- **`docs/SYNTHESIS.md`** — the founding decisions. The empty quadrant chart. The 5 strategic course-corrections.
- **`docs/SECURITY_AUDIT.md`** — OWASP + DPDP/PDPA mapping, every critical finding addressed.

**What to say:**
- "This is the entire founding stack — product, pricing, regulatory, AI, infra — costed and dated, sitting next to the code that implements it. The strategy lives in the repo, not a deck nobody opens."

---

## Closing shot (15 seconds)

Back in the browser, on the landing page. Hold the gold "Request your invitation" button.

**What to say:**
- "That's where Lumin is today. Stack live, schema live, security headers live, waitlist live, end-to-end round-trip. Next sprint: identity verification, JWT auth, the weekly drop ritual, and the first 50 invited members in Singapore."

Cut.

---

## Cheat sheet — commands to keep open in a side terminal

```bash
# Tail the dev server log (great for "look, real traffic" shots)
tail -f /tmp/lumin-dev.log

# Watch the DB live
watch -n 1 'docker exec lumin-dev-postgres-1 psql -U lumin -d lumin -c "SELECT COUNT(*) AS waitlist_count FROM \"WaitlistEntry\";"'

# Read the most recent submission
docker exec lumin-dev-postgres-1 psql -U lumin -d lumin -c 'SELECT * FROM "WaitlistEntry" ORDER BY "createdAt" DESC LIMIT 1;'

# Show the full Lumin schema in psql
docker exec -it lumin-dev-postgres-1 psql -U lumin -d lumin
# then inside psql:
\dt
\d "Match"
```

## Things to *not* show on camera (yet)

- The auth flow (still a guarded stub — the security audit caught this and we gated it).
- The chat (Socket.io gateway disabled in production until JWT lands).
- The admin panel (empty shell).
- The mobile app (Expo skeleton only).
- `.env` files (contain dev secrets — don't show the full file).

## If something breaks live on tape

| Symptom | Quick fix |
|---|---|
| Submit returns `persist_failed` | Postgres isn't reachable. Run `docker compose -f infra/docker/docker-compose.dev.yml ps` to check; restart with `pnpm docker:up`. |
| Page is blank | Dev server crashed. `cat /tmp/lumin-dev.log` to see the stack; restart with `pnpm --filter @lumin/web dev`. |
| `EADDRINUSE :3000` | Another process owns the port. `lsof -ti :3000 \| xargs kill -9` then restart. |
| Postgres `denied access` | Wrong port. We use **5433**, not 5432 (your machine has a local Postgres on 5432). |
