// Dev seed for Undate. Creates a founder, a small waitlist, and a diverse cohort
// of demo members in Singapore so the matching ranker has real candidates to
// score against. Each member has a profile, preferences, personality, and a
// values-sort onboarding response.
//
// Safety: refuses to run when NODE_ENV is "production".

import {
  PrismaClient,
  Region,
  AuthProvider,
  UserStatus,
  SubscriptionTier,
  Gender,
  RelationshipGoal,
  AttachmentStyle,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.error('Refusing to seed in production.');
  process.exit(1);
}

interface DemoMember {
  email: string;
  displayName: string;
  age: number;
  gender: Gender;
  city: string;
  bio: string;
  goal: RelationshipGoal;
  attachment: AttachmentStyle;
  bigFive: [number, number, number, number, number];
  values: string[];
  kids: 'YES' | 'NO' | 'OPEN' | 'HAVE_WANT_MORE' | 'HAVE_DONE';
  acceptedGenders: Gender[];
  ageMin: number;
  ageMax: number;
  /** Pravatar IDs (1..70) used to deterministically pick fake AI faces. */
  photoIds: number[];
}

const PASSWORD = 'undate-demo-2026'; // For demo only; never in prod.

const DEMO_MEMBERS: DemoMember[] = [
  {
    email: 'priya@undate.local',
    displayName: 'Priya',
    age: 31,
    gender: 'WOMAN',
    city: 'Singapore',
    bio: 'Architect at a Tiong Bahru studio. Long-distance runner. Slow reader.',
    goal: 'LIFE_PARTNER',
    attachment: 'SECURE',
    bigFive: [0.7, 0.7, 0.5, 0.65, 0.35],
    values: ['Family', 'Creativity', 'Curiosity', 'Honesty', 'Health'],
    kids: 'OPEN',
    acceptedGenders: ['MAN'],
    ageMin: 30,
    ageMax: 42,
    photoIds: [5, 36],
  },
  {
    email: 'arjun@undate.local',
    displayName: 'Arjun',
    age: 34,
    gender: 'MAN',
    city: 'Singapore',
    bio: 'Founder of a small dev-tools company. Cooks better than he admits.',
    goal: 'LIFE_PARTNER',
    attachment: 'SECURE',
    bigFive: [0.75, 0.7, 0.6, 0.65, 0.3],
    values: ['Career', 'Family', 'Curiosity', 'Honesty', 'Humor'],
    kids: 'YES',
    acceptedGenders: ['WOMAN'],
    ageMin: 28,
    ageMax: 36,
    photoIds: [11, 14],
  },
  {
    email: 'mei@undate.local',
    displayName: 'Mei',
    age: 29,
    gender: 'WOMAN',
    city: 'Singapore',
    bio: 'Consultant. Bouldering twice a week. Quietly nerdy about coffee.',
    goal: 'SERIOUS_DATING',
    attachment: 'ANXIOUS',
    bigFive: [0.55, 0.6, 0.7, 0.7, 0.7],
    values: ['Adventure', 'Career', 'Health', 'Curiosity', 'Humor'],
    kids: 'OPEN',
    acceptedGenders: ['MAN', 'NONBINARY'],
    ageMin: 27,
    ageMax: 38,
    photoIds: [9, 25],
  },
  {
    email: 'raj@undate.local',
    displayName: 'Raj',
    age: 36,
    gender: 'MAN',
    city: 'Singapore',
    bio: 'Quant. Lapsed musician. Looks for kindness in small things.',
    goal: 'MARRIAGE',
    attachment: 'SECURE',
    bigFive: [0.65, 0.75, 0.4, 0.7, 0.25],
    values: ['Family', 'Stability', 'Health', 'Service', 'Honesty'],
    kids: 'YES',
    acceptedGenders: ['WOMAN'],
    ageMin: 28,
    ageMax: 36,
    photoIds: [12, 17],
  },
  {
    email: 'kira@undate.local',
    displayName: 'Kira',
    age: 33,
    gender: 'WOMAN',
    city: 'Singapore',
    bio: 'Editor at a small literary magazine. Grew up between three countries.',
    goal: 'LIFE_PARTNER',
    attachment: 'SECURE',
    bigFive: [0.85, 0.55, 0.45, 0.65, 0.4],
    values: ['Creativity', 'Curiosity', 'Independence', 'Honesty', 'Humor'],
    kids: 'OPEN',
    acceptedGenders: ['MAN', 'WOMAN'],
    ageMin: 30,
    ageMax: 42,
    photoIds: [16, 40],
  },
  {
    email: 'jake@undate.local',
    displayName: 'Jake',
    age: 39,
    gender: 'MAN',
    city: 'Singapore',
    bio: 'Surgeon. Trains for triathlons. Has a Labrador named Sam.',
    goal: 'MARRIAGE',
    attachment: 'AVOIDANT',
    bigFive: [0.5, 0.85, 0.45, 0.6, 0.3],
    values: ['Career', 'Health', 'Independence', 'Stability', 'Service'],
    kids: 'OPEN',
    acceptedGenders: ['WOMAN'],
    ageMin: 30,
    ageMax: 40,
    photoIds: [7, 33],
  },
  {
    email: 'tara@undate.local',
    displayName: 'Tara',
    age: 27,
    gender: 'WOMAN',
    city: 'Singapore',
    bio: 'Designer. Just moved from Bombay. Looking for someone curious.',
    goal: 'SERIOUS_DATING',
    attachment: 'ANXIOUS',
    bigFive: [0.7, 0.6, 0.65, 0.7, 0.65],
    values: ['Creativity', 'Adventure', 'Curiosity', 'Honesty', 'Family'],
    kids: 'OPEN',
    acceptedGenders: ['MAN'],
    ageMin: 26,
    ageMax: 36,
    photoIds: [19, 44],
  },
  {
    email: 'omar@undate.local',
    displayName: 'Omar',
    age: 32,
    gender: 'MAN',
    city: 'Singapore',
    bio: 'Investor. Reads three books at once. Quietly excellent at gimlets.',
    goal: 'LIFE_PARTNER',
    attachment: 'SECURE',
    bigFive: [0.7, 0.7, 0.55, 0.7, 0.35],
    values: ['Curiosity', 'Honesty', 'Family', 'Stability', 'Humor'],
    kids: 'YES',
    acceptedGenders: ['WOMAN', 'NONBINARY'],
    ageMin: 27,
    ageMax: 37,
    photoIds: [22, 51],
  },
  {
    email: 'leah@undate.local',
    displayName: 'Leah',
    age: 35,
    gender: 'WOMAN',
    city: 'Singapore',
    bio: 'Therapist. Two cats. Tells excellent stories at dinner.',
    goal: 'MARRIAGE',
    attachment: 'SECURE',
    bigFive: [0.65, 0.7, 0.5, 0.85, 0.3],
    values: ['Service', 'Honesty', 'Family', 'Health', 'Curiosity'],
    kids: 'OPEN',
    acceptedGenders: ['MAN', 'WOMAN'],
    ageMin: 30,
    ageMax: 42,
    photoIds: [23, 47],
  },
  {
    email: 'sam@undate.local',
    displayName: 'Sam',
    age: 30,
    gender: 'NONBINARY',
    city: 'Singapore',
    bio: 'Researcher in computational neuroscience. Cooks Sichuan on weekends.',
    goal: 'LIFE_PARTNER',
    attachment: 'SECURE',
    bigFive: [0.85, 0.7, 0.55, 0.7, 0.35],
    values: ['Curiosity', 'Independence', 'Creativity', 'Humor', 'Honesty'],
    kids: 'OPEN',
    acceptedGenders: ['MAN', 'WOMAN', 'NONBINARY'],
    ageMin: 26,
    ageMax: 38,
    photoIds: [49, 18],
  },
];

const VALUE_TO_SCHWARTZ: Record<string, number[]> = {
  Family:       [0.1, 0.7, 0.5, 0.1, 0.1, 0.6, 0.1, 0.1, 0.7, 0.2],
  Career:       [0.9, 0.1, 0.2, 0.2, 0.7, 0.4, 0.4, 0.3, 0.1, 0.1],
  Creativity:   [0.4, 0.3, 0.1, 0.4, 0.1, 0.1, 0.9, 0.7, 0.1, 0.3],
  Adventure:    [0.2, 0.2, 0.0, 0.6, 0.2, 0.0, 0.6, 1.0, 0.0, 0.2],
  Stability:    [0.2, 0.4, 0.7, 0.1, 0.2, 1.0, 0.2, 0.0, 0.6, 0.2],
  Faith:        [0.1, 0.5, 0.8, 0.0, 0.1, 0.5, 0.1, 0.0, 1.0, 0.3],
  Health:       [0.4, 0.4, 0.4, 0.3, 0.2, 0.7, 0.5, 0.3, 0.2, 0.4],
  Curiosity:    [0.4, 0.4, 0.1, 0.3, 0.1, 0.1, 0.9, 0.7, 0.1, 0.5],
  Honesty:      [0.3, 0.7, 0.6, 0.1, 0.1, 0.4, 0.5, 0.1, 0.3, 0.7],
  Independence: [0.5, 0.2, 0.1, 0.3, 0.4, 0.3, 1.0, 0.5, 0.1, 0.3],
  Service:      [0.2, 1.0, 0.4, 0.1, 0.1, 0.3, 0.2, 0.1, 0.3, 0.9],
  Humor:        [0.2, 0.5, 0.1, 0.6, 0.1, 0.1, 0.6, 0.6, 0.1, 0.4],
};

function valuesToSchwartz(values: string[]): number[] {
  const acc = new Array<number>(10).fill(0);
  for (const v of values) {
    const vec = VALUE_TO_SCHWARTZ[v];
    if (!vec) continue;
    for (let i = 0; i < 10; i++) acc[i] = (acc[i] ?? 0) + (vec[i] ?? 0);
  }
  const max = Math.max(...acc) || 1;
  return acc.map((x) => x / max);
}

// Map Big Five → MBTI (McCrae & Costa correlations): E/I↔extraversion,
// N/S↔openness, F/T↔agreeableness, J/P↔conscientiousness.
function deriveMbti(bigFive: [number, number, number, number, number]): string {
  const [openness, conscientiousness, extraversion, agreeableness] = bigFive;
  return (
    (extraversion >= 0.5 ? 'E' : 'I') +
    (openness >= 0.5 ? 'N' : 'S') +
    (agreeableness >= 0.5 ? 'F' : 'T') +
    (conscientiousness >= 0.5 ? 'J' : 'P')
  );
}

// Derive a conversation/communication style from Big Five + attachment so the
// PersonalityProfile.communicationStyle field is populated for demo members.
function deriveCommStyle(m: DemoMember): string {
  const [openness, conscientiousness, extraversion, agreeableness] = m.bigFive;
  if (m.attachment === 'AVOIDANT' || conscientiousness > 0.8) return 'ANALYTICAL';
  if (agreeableness > 0.78) return 'GENTLE';
  if (extraversion > 0.6 && openness > 0.6) return 'PLAYFUL';
  if (openness > 0.75) return 'REFLECTIVE';
  return 'DIRECT';
}

async function upsertMember(m: DemoMember): Promise<string> {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - m.age);
  const schwartz = valuesToSchwartz(m.values);

  const user = await prisma.user.upsert({
    where: { email: m.email },
    update: { lastActiveAt: new Date() },
    create: {
      email: m.email,
      passwordHash,
      authProvider: AuthProvider.EMAIL,
      status: UserStatus.ACTIVE,
      residencyRegion: Region.SG,
      profile: {
        create: {
          displayName: m.displayName,
          dateOfBirth: dob,
          gender: m.gender,
          city: m.city,
          bioShort: m.bio,
          relationshipGoal: m.goal,
          completionScore: 100,
          curatorReady: true,
        },
      },
      preferences: {
        create: {
          ageMin: m.ageMin,
          ageMax: m.ageMax,
          acceptedGenders: m.acceptedGenders,
          goalsAcceptable: ['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER'],
        },
      },
      personality: {
        create: {
          attachmentStyle: m.attachment,
          communicationStyle: deriveCommStyle(m),
          mbtiType: deriveMbti(m.bigFive),
          openness: m.bigFive[0],
          conscientiousness: m.bigFive[1],
          extraversion: m.bigFive[2],
          agreeableness: m.bigFive[3],
          neuroticism: m.bigFive[4],
          modelVersion: 'seed-v0.1',
        },
      },
    },
    select: { id: true },
  });

  await prisma.onboardingResponse.upsert({
    where: { userId_questionKey: { userId: user.id, questionKey: 'values_top5' } },
    create: { userId: user.id, questionKey: 'values_top5', answer: { picks: m.values, schwartz } },
    update: { answer: { picks: m.values, schwartz } },
  });
  await prisma.onboardingResponse.upsert({
    where: { userId_questionKey: { userId: user.id, questionKey: 'kids' } },
    create: { userId: user.id, questionKey: 'kids', answer: { pick: m.kids } },
    update: { answer: { pick: m.kids } },
  });

  // Photos. We use pravatar.cc with deterministic image IDs so the same demo
  // user always gets the same face — important for screen recordings.
  // Wipe and recreate to keep idempotency on repeated `pnpm db:seed`.
  await prisma.photo.deleteMany({ where: { userId: user.id } });
  await prisma.photo.createMany({
    data: m.photoIds.map((imgId, idx) => ({
      userId: user.id,
      s3Key: `https://i.pravatar.cc/800?img=${imgId}`,
      width: 800,
      height: 800,
      orderIdx: idx,
      isPrimary: idx === 0,
      moderationStatus: 'APPROVED' as const,
      blurhash: null,
    })),
  });
  return user.id;
}

async function main() {
  // Founder (concierge).
  const founderPw = await bcrypt.hash(PASSWORD, 12);
  const founder = await prisma.user.upsert({
    where: { email: 'founder@undate.local' },
    update: { passwordHash: founderPw, isAdmin: true },
    create: {
      email: 'founder@undate.local',
      phoneE164: '+6580000001',
      passwordHash: founderPw,
      authProvider: AuthProvider.EMAIL,
      status: UserStatus.ACTIVE,
      isAdmin: true, // demo admin — signs in to the /admin curation dashboard
      residencyRegion: Region.SG,
      locale: 'en',
      profile: {
        create: {
          displayName: 'Aanya',
          dateOfBirth: new Date('1992-04-12'),
          gender: Gender.WOMAN,
          city: 'Singapore',
          bioShort: 'Architect, runner, slow reader.',
          curatorReady: true,
          completionScore: 100,
        },
      },
      subscription: { create: { tier: SubscriptionTier.CONCIERGE, status: 'ACTIVE' } },
    },
  });

  // A few WAITING entries (with questionnaire answers) so the admin Approve
  // button has something to act on out of the box.
  const demoWaitlist = [
    {
      email: 'noor@undate.local',
      city: 'Singapore',
      referralCode: 'UNDATE-WL-01',
      answers: {
        ageRange: '30-34',
        intention: 'LIFE_PARTNER',
        lookingFor: 'Someone curious and kind who reads at night and travels light.',
        whyJoin: 'I am done with swiping. I want a small number of real introductions, considered well.',
      },
    },
    {
      email: 'devon@undate.local',
      city: 'Singapore',
      referralCode: 'UNDATE-WL-02',
      answers: {
        ageRange: '35-39',
        intention: 'MARRIAGE',
        lookingFor: 'A warm, grounded partner who wants to build a home.',
        whyJoin: 'A friend told me this was the only place that took matchmaking seriously.',
      },
    },
    {
      email: 'aria@undate.local',
      city: 'Singapore',
      referralCode: 'UNDATE-WL-03',
      answers: {
        ageRange: '25-29',
        intention: 'SERIOUS_DATING',
        lookingFor: 'Playful, a little nerdy, up for a 3am conversation.',
        whyJoin: 'I want to meet people through intention, not an endless feed.',
      },
    },
  ];
  for (const w of demoWaitlist) {
    await prisma.waitlistEntry.upsert({
      where: { email: w.email },
      update: { answers: w.answers },
      create: {
        email: w.email,
        region: Region.SG,
        city: w.city,
        referralCode: w.referralCode,
        status: 'WAITING',
        answers: w.answers,
      },
    });
  }

  // A PENDING_REVIEW user — registered + onboarded, awaiting admin Activate.
  const pendingPw = await bcrypt.hash(PASSWORD, 12);
  const pendingDob = new Date();
  pendingDob.setFullYear(pendingDob.getFullYear() - 32);
  await prisma.user.upsert({
    where: { email: 'pending@undate.local' },
    update: { status: UserStatus.PENDING_REVIEW, passwordHash: pendingPw },
    create: {
      email: 'pending@undate.local',
      passwordHash: pendingPw,
      authProvider: AuthProvider.EMAIL,
      status: UserStatus.PENDING_REVIEW,
      residencyRegion: Region.SG,
      profile: {
        create: {
          displayName: 'Hana',
          dateOfBirth: pendingDob,
          gender: Gender.WOMAN,
          city: 'Singapore',
          bioShort: 'Documentary editor. Sea swimmer. Collects other people’s stories.',
          relationshipGoal: 'LIFE_PARTNER',
          completionScore: 100,
          curatorReady: true,
        },
      },
      preferences: {
        create: {
          ageMin: 30,
          ageMax: 42,
          acceptedGenders: ['MAN'],
          goalsAcceptable: ['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER'],
        },
      },
      personality: {
        create: {
          attachmentStyle: AttachmentStyle.SECURE,
          communicationStyle: 'REFLECTIVE',
          mbtiType: 'INFJ',
          openness: 0.8,
          conscientiousness: 0.6,
          extraversion: 0.45,
          agreeableness: 0.7,
          neuroticism: 0.4,
          modelVersion: 'seed-v0.1',
        },
      },
    },
  });

  const ids: string[] = [];
  for (const m of DEMO_MEMBERS) ids.push(await upsertMember(m));

  // ─── Seed one MUTUAL conversation + one INTRO so the demo inbox is alive ──
  // Priya ↔ Arjun = MUTUAL with a populated thread.
  // Mei → Raj    = ACCEPTED_A (intro sent, awaiting his reply) — shows the
  //                 "introduction" inbox state.
  const seedById = async (email: string) => {
    const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!u) throw new Error(`Missing seed user ${email}`);
    return u.id;
  };
  const priyaId = await seedById('priya@undate.local');
  const arjunId = await seedById('arjun@undate.local');
  const meiId = await seedById('mei@undate.local');
  const rajId = await seedById('raj@undate.local');

  function canonical(a: string, b: string) {
    return a < b ? { aId: a, bId: b } : { aId: b, bId: a };
  }
  function weekIdNow() {
    const d = new Date();
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
    const week = 1 + Math.floor(diff / 7);
    return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  const weekId = weekIdNow();

  // Clear any prior demo Match rows so re-seeding is idempotent.
  await prisma.match.deleteMany({
    where: {
      OR: [
        { userAId: { in: [priyaId, arjunId] }, userBId: { in: [priyaId, arjunId] } },
        { userAId: { in: [meiId, rajId] }, userBId: { in: [meiId, rajId] } },
      ],
    },
  });

  // 1) Priya ↔ Arjun MUTUAL — a populated quiet match.
  {
    const { aId, bId } = canonical(priyaId, arjunId);
    const match = await prisma.match.create({
      data: {
        userAId: aId,
        userBId: bId,
        weekId,
        compatibilityScore: 0.92,
        scoreBreakdown: { attachment: 1.0, goal: 1.0, kids: 1.0, values: 0.95, neuroticismRisk: 0.85, age: 0.95 },
        aiNarrative:
          'Both wrote that they want a life partner, both score Secure, both keep slow Sundays. A small wager that you would talk through dinner.',
        state: 'MUTUAL',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        mutualAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      },
    });
    const conv = await prisma.conversation.create({
      data: {
        matchId: match.id,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 28),
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
        participants: { create: [{ userId: priyaId }, { userId: arjunId }] },
      },
    });
    const seq: { senderId: string; body: string; ageMin: number }[] = [
      {
        senderId: arjunId,
        body:
          "Priya — your bio says 'slow reader' and that's the most calming thing I've read all week. What's on your bedside table right now?",
        ageMin: 28 * 60,
      },
      {
        senderId: priyaId,
        body:
          "Arjun — Tomas Tranströmer (someone gave me a copy two years ago and I've been pacing through it) and a very practical book on retaining walls. Yours?",
        ageMin: 26 * 60,
      },
      {
        senderId: arjunId,
        body: "I am, embarrassingly, three chapters into 'The Master and Margarita' for the third time. It feels Russian-winter-coded — wrong for May. What did you do this Sunday?",
        ageMin: 5 * 60,
      },
      {
        senderId: priyaId,
        body:
          'Sunday: a long run from East Coast at sunrise, then proper breakfast at Tiong Bahru Bakery. Could be persuaded to do it again, with company.',
        ageMin: 30,
      },
    ];
    for (const m of seq) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: m.senderId,
          kind: 'TEXT',
          body: m.body,
          aiAssisted: false,
          createdAt: new Date(Date.now() - m.ageMin * 60 * 1000),
        },
      });
    }
  }

  // 2) Mei → Raj: opener sent, awaiting Raj's reply (state ACCEPTED_A or B
  //    depending on canonical order).
  {
    const { aId, bId } = canonical(meiId, rajId);
    const iAmA = meiId === aId;
    const match = await prisma.match.create({
      data: {
        userAId: aId,
        userBId: bId,
        weekId,
        compatibilityScore: 0.78,
        scoreBreakdown: { attachment: 0.75, goal: 0.85, kids: 0.7, values: 0.7, neuroticismRisk: 0.55, age: 0.9 },
        state: iAmA ? 'ACCEPTED_A' : 'ACCEPTED_B',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });
    const conv = await prisma.conversation.create({
      data: {
        matchId: match.id,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        participants: { create: [{ userId: meiId }, { userId: rajId }] },
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: meiId,
        kind: 'TEXT',
        body:
          'Raj — the line about looking for kindness in small things landed. The smallest kindness I have received recently was a stranger holding the lift for me with a bag of groceries. What about you?',
        aiAssisted: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log({
    founder: founder.id,
    demoMembers: ids.length,
    seededConversations: 2,
    password: PASSWORD,
    admin: 'founder@undate.local (isAdmin) — open /admin after signing in',
    pendingReview: 'pending@undate.local — Activate from /admin',
    waitlist: 'noor@ / devon@ / aria@undate.local — Approve from /admin',
    members: DEMO_MEMBERS.map((m) => m.email).join(', '),
    note: 'All accounts share the password above. Sign in at /login.',
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
