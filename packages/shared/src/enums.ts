// Lumin shared enums. Mirror Prisma enums; do not import from @prisma/client here
// so this package stays usable in edge / RN runtimes without the Prisma client.

export const SubscriptionTier = {
  FREE: 'FREE',
  PLUS: 'PLUS',
  CONCIERGE: 'CONCIERGE',
  VIP: 'VIP',
} as const;
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const Region = {
  IN: 'IN',
  SG: 'SG',
  EU: 'EU',
  US: 'US',
  AE: 'AE',
  OTHER: 'OTHER',
} as const;
export type Region = (typeof Region)[keyof typeof Region];

export const Gender = {
  WOMAN: 'WOMAN',
  MAN: 'MAN',
  NONBINARY: 'NONBINARY',
  OTHER: 'OTHER',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const RelationshipGoal = {
  SERIOUS_DATING: 'SERIOUS_DATING',
  MARRIAGE: 'MARRIAGE',
  LIFE_PARTNER: 'LIFE_PARTNER',
  EXPLORING: 'EXPLORING',
} as const;
export type RelationshipGoal =
  (typeof RelationshipGoal)[keyof typeof RelationshipGoal];

export const AttachmentStyle = {
  SECURE: 'SECURE',
  ANXIOUS: 'ANXIOUS',
  AVOIDANT: 'AVOIDANT',
  DISORGANIZED: 'DISORGANIZED',
  UNKNOWN: 'UNKNOWN',
} as const;
export type AttachmentStyle =
  (typeof AttachmentStyle)[keyof typeof AttachmentStyle];

export const MatchState = {
  PROPOSED: 'PROPOSED',
  DELIVERED: 'DELIVERED',
  VIEWED: 'VIEWED',
  PASSED_A: 'PASSED_A',
  PASSED_B: 'PASSED_B',
  SAVED_A: 'SAVED_A',
  SAVED_B: 'SAVED_B',
  ACCEPTED_A: 'ACCEPTED_A',
  ACCEPTED_B: 'ACCEPTED_B',
  MUTUAL: 'MUTUAL',
  EXPIRED: 'EXPIRED',
  CONCLUDED: 'CONCLUDED',
} as const;
export type MatchState = (typeof MatchState)[keyof typeof MatchState];

export const ReportReason = {
  HARASSMENT: 'HARASSMENT',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  FAKE_PROFILE: 'FAKE_PROFILE',
  SCAM: 'SCAM',
  MINOR: 'MINOR',
  VIOLENCE_THREAT: 'VIOLENCE_THREAT',
  OFF_PLATFORM_REDIRECT: 'OFF_PLATFORM_REDIRECT',
  OTHER: 'OTHER',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

// Tier entitlements. The single source of truth used by both billing and UI.
export const TIER_ENTITLEMENTS = {
  FREE: {
    matchesPerWeek: 1,
    aiIcebreakers: false,
    voicePromptVisible: false,
    conciergeAccess: false,
    crossRegion: false,
  },
  PLUS: {
    matchesPerWeek: 3,
    aiIcebreakers: true,
    voicePromptVisible: true,
    conciergeAccess: false,
    crossRegion: false,
  },
  CONCIERGE: {
    matchesPerWeek: 5,
    aiIcebreakers: true,
    voicePromptVisible: true,
    conciergeAccess: true,
    crossRegion: true,
  },
  VIP: {
    matchesPerWeek: 5,
    aiIcebreakers: true,
    voicePromptVisible: true,
    conciergeAccess: true,
    crossRegion: true,
  },
} as const satisfies Record<SubscriptionTier, unknown>;

// Pricing per region, derived from market research.
export const PRICING = {
  PLUS: { INR: 1499_00, SGD: 32_00, USD: 24_00 },
  CONCIERGE: { INR: 6999_00, SGD: 129_00, USD: 99_00 },
  VIP: { INR: 65000_00, SGD: 1199_00, USD: 899_00 }, // per quarter
} as const;
