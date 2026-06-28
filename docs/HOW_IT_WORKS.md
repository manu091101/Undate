# How Lumin Works — A Walk-Through for Anyone

> Read in 5 minutes. Written for people who will use Lumin, talk about Lumin, invest in Lumin, or join the team — not for engineers. No code in this document.

---

## 1. The shape of the thing

Lumin is not a dating app you swipe on. It is a **considered matchmaking service**, delivered through software, that does three things:

1. **It gets to know you.** You spend about ten minutes telling it who you are — your values, what you want out of a relationship, how you handle conflict, what kind of life you want. Real questions, not "what's your sign?"
2. **It introduces you to a few people each week.** Three. Not three hundred. Drawn from a small pool of verified, interview-style members in your city. Reviewed by a real matchmaker before they reach you.
3. **It leaves you alone in between.** No streaks. No notifications begging you to come back. No counter showing how many people liked your photo. Lumin is designed to be closed, not opened.

The ritual is Sunday evening at 7pm. Your phone buzzes once. Three profiles. You read them slowly. You decide. That is the whole experience.

---

## 2. What you do as a Lumin member, step by step

### Step 1 — Request an invitation (60 seconds)

You go to `lumin.app` and fill in a short form: name, email, your city, optionally a referral code. We accept members slowly — Lumin is not a free product, and the curation only works at small scale per city.

If you are accepted, we send you a private link.

### Step 2 — Create your account (2 minutes)

Email, password, date of birth (Lumin is strictly 21+), gender, the city you actually live in.

### Step 3 — Onboarding (10 minutes, in seven small steps)

This is where Lumin gets to know you:
- **Pick five values that matter most** out of twelve cards (Family, Career, Creativity, Adventure, Stability, Faith, Health, Curiosity, Honesty, Independence, Service, Humor).
- **What are you looking for?** A serious relationship. A life partner. Marriage. Open and exploring.
- **When something is wrong, you usually—** This is a quiet way of asking about your attachment style. We never use that word at you; you tell us how you naturally react to conflict.
- **Children?** Yes. Open. No. Have-want-more. Have-done.
- **Most weeknights you prefer—** A slider between "quiet at home" and "out with people."
- **In one line — who are you?** Your one-sentence bio. Up to 280 characters. Just like a strong dating profile, written in your own voice.
- **Who would you like to meet?** Gender, age range.

You can leave and come back. Your progress saves automatically. The bar at the top fills up.

### Step 4 — A curator reviews your profile (24–48 hours)

This is the quiet part. A real human at Lumin (we hire curators with backgrounds in matchmaking, counselling, or community management — not interns) looks at your profile, decides whether the photos and answers feel coherent, and either approves you or sends a friendly note asking for a clearer photo / a less generic bio / a missing detail. Around 95% of members are approved within two days.

### Step 5 — Your first Sunday drop

Sunday at 7pm, local time. A single push notification: "Your Sunday drop is ready."

You open Lumin. You see one profile. Photos, voice intro, the one-line bio. Below: a sentence written by Lumin — *Why we curated this match for you* — referencing only what is in both profiles. ("You both value depth and have careers in fields that require sustained attention. Her communication style is direct, which complements your reflectiveness.")

Three buttons:
- **Pass with thanks** — graceful, anonymous.
- **Save for later** — keep in your private list for 14 days.
- **Send an opener** — opens a chat. The opener is yours to write. Lumin can suggest three, but you decide.

You see the second profile. The third. You cannot scroll back. The decision happens once.

### Step 6 — When you connect

The chat is private. It looks like iMessage — bubbles, voice notes, the option to share a song. There is a small lavender ✦ above your keyboard. Tap it and Lumin suggests three things you could say next, grounded in what you have already exchanged. You may use one, edit it, or ignore it. **Lumin never sends a message for you.**

When the conversation feels real, you ask to meet. The Concierge tier can help with that — venue suggestions, calendar coordination — but it is always your choice.

### Step 7 — After the date

We send a single, optional question forty-eight hours later: *Did you meet? How did it go?* Your answer trains the ranker so the next person Lumin shows you is closer to right.

That is the whole loop.

---

## 3. Who is on the other side of the screen

Lumin is a small company today. Behind the website:

- **Engineers** who built the website, the database, the matchmaker brain. (See [TECH_STACK.md](TECH_STACK.md) if you want the nuts and bolts.)
- **Curators** — real people in Singapore and Mumbai who review every profile by hand and every match before it ships. A curator handles about 200 active members each.
- **A Head of Trust & Safety** who reviews every report within 24 hours.
- **A Concierge team** for the top membership tier — they conduct intake calls, suggest date plans, and follow up after dates.

There is no offshore moderation farm. There is no boiler-room sales operation. The team is small on purpose.

---

## 4. What the matchmaker brain actually does

This is the most-asked question, so it gets its own section.

When you finish onboarding, Lumin's matching engine — a piece of software in `packages/shared/src/matching.ts` (you can read it; it is about 200 lines of plain code) — compares you against every other active member in your city. For each potential pairing, it computes a score across six dimensions:

1. **Attachment fit.** Are your conflict-response styles complementary?
2. **Goal alignment.** Do you both want the same kind of relationship?
3. **Children plans.** A clear yes from one and a clear no from the other is a near-hard-filter.
4. **Values overlap.** Schwartz's 10-axis values model, weighted toward conservation and self-transcendence (these have the most peer-reviewed evidence for predicting satisfaction).
5. **Emotional stability balance.** Two highly anxious partners is the only Big Five pattern with robust evidence for elevated dissolution risk; we score it carefully.
6. **Age proximity.** A soft signal — six years is a Gaussian peak, anything wider penalised gently.

Each score is between zero and one. They combine with documented weights into a single number, displayed in the UI as a percentage.

**It is not magic.** Lumin does not claim to predict who you will fall in love with. The largest study of long-term relationships ever conducted (PNAS, 2020, eleven thousand couples) found that pre-meeting variables explain less than 1% of the variance in relationship satisfaction. What our score can do is **filter out the bottom 50% of candidates** — the people whose life goals or attachment patterns make a long-term match structurally unlikely — so the curator (and you) spend time only on people who could realistically be your partner.

Then the curator overrides whatever they want to. The model is a starting point.

Once Lumin has enough real outcomes (mutual matches → first dates → second dates → relationships), we replace the rule-based scoring with a **machine-learned ranker** trained on Lumin's own data. That model becomes more accurate over time. It is also the moat — no competitor has Lumin's outcomes, so no competitor can train this model.

For the full version of this section, read [AI_EXPLAINED.md](AI_EXPLAINED.md).

---

## 5. The boundaries Lumin draws

There are several things Lumin will not do, and they are worth naming because most dating apps do all of them.

1. **No infinite scroll.** Three matches a week. They expire. They do not pile up.
2. **No vanity metrics.** No likes count. No profile-view count. No "your activity score is 67."
3. **No streaks.** No "you haven't opened Lumin in three days!" Push notifications are capped at two per week.
4. **No autonomous AI.** The AI suggests; it never sends.
5. **No off-platform redirects.** The safety system detects "let's move to WhatsApp" early in the relationship and flags it — that is the romance-scam pattern.
6. **No data sale.** Lumin's revenue is membership fees, full stop. Your data is not the product.
7. **No under-21s.** Strict floor, globally. More conservative than DPDP or PDPA requires.
8. **No cross-region data movement by default.** If you live in India, your data lives in our Mumbai region. Singapore stays in Singapore. The exception is a top-tier opt-in for members who explicitly want introductions across the SG-India corridor.

---

## 6. The membership tiers

| Tier | India | Singapore | What you get |
|---|---|---|---|
| **Free** | ₹0 | $0 | One curated match per week. The basics. |
| **Plus** | ₹1,499 / month | SGD 32 / month | Three matches per week. AI conversation suggestions. Voice intros on profiles. |
| **Concierge** | ₹6,999 / month | SGD 129 / month | Five matches per week. Dedicated human matchmaker. Profile-coaching session. Priority review. Date-planning support. |
| **VIP** | ₹65,000 / quarter | SGD 1,199 / quarter | Off-app introductions. Member events. Cross-region opt-in. The Concierge knows you personally. |

Plus is sold through the App Store and Google Play. Concierge and VIP are sold through the website with a real onboarding call, which lets us keep the Apple/Google 30% fee off the high-touch tiers.

---

## 7. What Lumin will look like a year from now

The product you see today is the **MVP foundation**. It already does live registration, live onboarding, and live matching against a small cohort. Between now and a year from now, the team will ship:

- **Phone-OTP and passkey login** (the temporary email/password gives way to friction-free, more secure sign-in).
- **Real photo + voice + video intros** with face-verification and EXIF-stripping at upload time.
- **The Sunday-night batch matchmaking pipeline** with Anthropic-written compatibility narratives, reviewed by a real curator before delivery.
- **A native iOS + Android app** built with React Native.
- **A Mumbai launch** alongside Singapore once we have ~2,000 verified members per metro.
- **A Concierge tier** with a real human matchmaker per member.

Then, in year two: **expansion to Bangalore, Delhi, Jakarta, and Hong Kong**, in that order. Saturate one city to two thousand verified members before opening the next. That is how a curated product gets density.

---

## 8. Why this exists at all

Online dating, as a category, has become a treadmill. Hinge's parent company, the largest dating-app holding company in the world, lost a quarter of its stock value in 2024 as users left for "off-app" methods. Bumble cut 30% of its workforce in mid-2025. Tinder's paying user base dropped by 1.5 million people in the same year. Surveys keep finding that most users feel worse, not better, after a typical session.

At the same time, **traditional human matchmaking is having a quiet renaissance.** Tawkify in the United States charges five thousand dollars per six-month package. Lunch Actually in Singapore has run profitably for twenty-two years on packages starting at two thousand Singapore dollars. The willingness to pay for a curated, considered, finite dating experience is proven.

The gap between thirty-dollar-per-month swipe apps and five-thousand-dollar human matchmakers is empty. That is the space Lumin lives in.

**Lumin is for people who would rather meet two of the right people than two hundred of the wrong ones.**

---

## 9. If you want to dig deeper

- The full architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- The tech stack, explained: [TECH_STACK.md](TECH_STACK.md)
- The AI, in detail: [AI_EXPLAINED.md](AI_EXPLAINED.md)
- The security and privacy plan: [SECURITY_AUDIT.md](SECURITY_AUDIT.md)
- The strategic synthesis (for investors and operators): [SYNTHESIS.md](SYNTHESIS.md)
- The unique selling proposition, live-cited: [USP.md](USP.md)
- The week-by-week build plan: [ROADMAP.md](ROADMAP.md)
