import { z } from 'zod';
import { Gender, RelationshipGoal, Region } from './enums';

// Reusable atoms
export const Email = z.string().email().max(254).toLowerCase();
export const PhoneE164 = z.string().regex(/^\+[1-9]\d{7,14}$/, 'Invalid E.164 phone');
export const Locale = z.enum(['en', 'hi', 'ta', 'zh', 'ms']);
export const RegionEnum = z.enum(Object.values(Region) as [Region, ...Region[]]);

// Short, structured questionnaire captured when someone joins the waitlist.
// Stored on WaitlistEntry.answers; the human signal an admin reads before approving.
export const WaitlistQuestionnaire = z.object({
  ageRange: z.enum(['21-24', '25-29', '30-34', '35-39', '40-44', '45+']),
  intention: z.enum(['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER', 'EXPLORING']),
  lookingFor: z.string().min(3).max(280),
  whyJoin: z.string().min(3).max(500),
});
export type WaitlistQuestionnaire = z.infer<typeof WaitlistQuestionnaire>;

export const WaitlistJoinInput = z.object({
  email: Email,
  phoneE164: PhoneE164.optional(),
  city: z.string().min(1).max(80).optional(),
  region: RegionEnum,
  referralCode: z.string().min(4).max(32).optional(),
  answers: WaitlistQuestionnaire.optional(),
});
export type WaitlistJoinInput = z.infer<typeof WaitlistJoinInput>;

export const PhoneStartInput = z.object({
  phoneE164: PhoneE164,
  locale: Locale.optional(),
});
export type PhoneStartInput = z.infer<typeof PhoneStartInput>;

export const PhoneVerifyInput = z.object({
  phoneE164: PhoneE164,
  code: z.string().regex(/^\d{6}$/),
  deviceFingerprint: z.string().min(8).max(128).optional(),
});
export type PhoneVerifyInput = z.infer<typeof PhoneVerifyInput>;

export const ProfileDraftInput = z.object({
  displayName: z.string().min(2).max(40),
  pronouns: z.string().max(24).optional(),
  dateOfBirth: z.coerce.date().refine(
    (d) => {
      const years = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return years >= 21 && years <= 95;
    },
    { message: 'Undate is 21+' },
  ),
  gender: z.enum(Object.values(Gender) as [Gender, ...Gender[]]),
  city: z.string().min(1).max(80),
  occupation: z.string().max(80).optional(),
  company: z.string().max(80).optional(),
  education: z.string().max(80).optional(),
  heightCm: z.number().int().min(120).max(230).optional(),
  relationshipGoal: z
    .enum(Object.values(RelationshipGoal) as [RelationshipGoal, ...RelationshipGoal[]])
    .optional(),
  bioShort: z.string().max(280).optional(),
  bioLong: z.string().max(2000).optional(),
});
export type ProfileDraftInput = z.infer<typeof ProfileDraftInput>;

export const MatchActionInput = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(['PASS', 'SAVE', 'CONNECT']),
  /** Required if action=CONNECT. The user's OWN opener message, Lumin never sends. */
  openerText: z.string().min(2).max(2000).optional(),
  /** Optional: opener anchors to a specific prompt or photo on the recipient's profile. */
  anchor: z
    .object({
      kind: z.enum(['prompt', 'photo']),
      id: z.string().min(1).max(120),
    })
    .optional(),
});
export type MatchActionInput = z.infer<typeof MatchActionInput>;

export const ProfilePromptInput = z.object({
  promptKey: z.string().min(2).max(60),
  answer: z.string().min(2).max(280),
  orderIdx: z.number().int().min(0).max(5).optional(),
});
export type ProfilePromptInput = z.infer<typeof ProfilePromptInput>;

export const PhotoCaptionInput = z.object({
  caption: z.string().max(140).nullable(),
});
export type PhotoCaptionInput = z.infer<typeof PhotoCaptionInput>;

export const SendMessageInputV2 = z.object({
  body: z.string().min(1).max(4000),
});
export type SendMessageInputV2 = z.infer<typeof SendMessageInputV2>;

export const SendMessageInput = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1).max(4000).optional(),
  mediaUrl: z.string().url().optional(),
  kind: z.enum(['TEXT', 'VOICE', 'IMAGE']).default('TEXT'),
  aiAssisted: z.boolean().default(false),
}).refine((v) => v.body || v.mediaUrl, { message: 'body or mediaUrl required' });
export type SendMessageInput = z.infer<typeof SendMessageInput>;

export const SignupInput = z.object({
  email: Email,
  password: z.string().min(8).max(72),
  displayName: z.string().min(2).max(40),
  dateOfBirth: z.coerce.date().refine(
    (d) => {
      const years = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return years >= 21 && years <= 95;
    },
    { message: 'Undate is 21+' },
  ),
  gender: z.enum(['WOMAN', 'MAN', 'NONBINARY', 'OTHER', 'PREFER_NOT_TO_SAY']),
  city: z.string().min(1).max(80),
  region: RegionEnum,
  // Single-use registration token from an admin approval. When present and valid
  // the new account is created as PENDING_REVIEW (gated). Absent = open/dev signup.
  inviteToken: z.string().min(10).max(200).optional(),
});
export type SignupInput = z.infer<typeof SignupInput>;

export const LoginInput = z.object({
  email: Email,
  password: z.string().min(8).max(72),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const ProfileUpdateInput = z.object({
  displayName: z.string().min(2).max(40).optional(),
  pronouns: z.string().max(24).optional().nullable(),
  city: z.string().min(1).max(80).optional(),
  occupation: z.string().max(80).optional().nullable(),
  company: z.string().max(80).optional().nullable(),
  workplace: z.string().max(120).optional().nullable(),
  education: z.string().max(120).optional().nullable(),
  heightCm: z.number().int().min(120).max(230).optional().nullable(),
  bioShort: z.string().max(280).optional().nullable(),
  bioLong: z.string().max(2000).optional().nullable(),
  aboutMe: z.string().max(2000).optional().nullable(),
  drinking: z.enum(['NEVER', 'SOCIALLY', 'REGULARLY', 'PREFER_NOT_SAY']).optional().nullable(),
  smoking: z.enum(['NEVER', 'SOCIALLY', 'REGULARLY', 'PREFER_NOT_SAY']).optional().nullable(),
  exercise: z.enum(['NEVER', 'SOMETIMES', 'OFTEN', 'DAILY']).optional().nullable(),
  diet: z
    .enum(['OMNIVORE', 'PESCATARIAN', 'VEGETARIAN', 'VEGAN', 'HALAL', 'KOSHER', 'OTHER'])
    .optional()
    .nullable(),
  religion: z.string().max(60).optional().nullable(),
  zodiacSign: z.string().max(20).optional().nullable(),
  interests: z.array(z.string().min(1).max(40)).max(15).optional(),
  languages: z.array(z.string().min(1).max(40)).max(8).optional(),
  relationshipGoal: z
    .enum(['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER', 'EXPLORING'])
    .optional(),
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateInput>;

export const PreferencesUpdateInput = z.object({
  ageMin: z.number().int().min(21).max(95).optional(),
  ageMax: z.number().int().min(21).max(95).optional(),
  distanceKm: z.number().int().min(1).max(20000).optional(),
  acceptedGenders: z
    .array(z.enum(['WOMAN', 'MAN', 'NONBINARY', 'OTHER', 'PREFER_NOT_TO_SAY']))
    .min(1)
    .optional(),
});
export type PreferencesUpdateInput = z.infer<typeof PreferencesUpdateInput>;

export const OnboardingSubmitInput = z.object({
  topValues: z.array(z.string().min(1)).min(3).max(5),
  relationshipGoal: z.enum(['SERIOUS_DATING', 'MARRIAGE', 'LIFE_PARTNER', 'EXPLORING']),
  wantsKids: z.enum(['YES', 'NO', 'OPEN', 'HAVE_WANT_MORE', 'HAVE_DONE']),
  attachmentSignal: z.enum(['SECURE', 'ANXIOUS', 'AVOIDANT', 'DISORGANIZED']),
  lifestylePace: z.number().int().min(1).max(7),
  bioShort: z.string().min(10).max(280),
  acceptedGenders: z
    .array(z.enum(['WOMAN', 'MAN', 'NONBINARY', 'OTHER', 'PREFER_NOT_TO_SAY']))
    .min(1),
  ageMin: z.number().int().min(21).max(95),
  ageMax: z.number().int().min(21).max(95),
});
export type OnboardingSubmitInput = z.infer<typeof OnboardingSubmitInput>;

// AI onboarding chatbot transcript turn.
export const ChatTurn = z.object({
  role: z.enum(['assistant', 'user']),
  content: z.string().min(1).max(4000),
});
export type ChatTurn = z.infer<typeof ChatTurn>;

// POST /api/onboarding/chat, request the next chatbot turn given the history.
export const OnboardingChatInput = z.object({
  history: z.array(ChatTurn).max(40),
});
export type OnboardingChatInput = z.infer<typeof OnboardingChatInput>;

// POST /api/onboarding/finalize, infer a trait profile from the whole transcript.
export const OnboardingChatFinalizeInput = z.object({
  transcript: z.array(ChatTurn).min(2).max(40),
  acceptedGenders: z
    .array(z.enum(['WOMAN', 'MAN', 'NONBINARY', 'OTHER', 'PREFER_NOT_TO_SAY']))
    .min(1),
  ageMin: z.number().int().min(21).max(95),
  ageMax: z.number().int().min(21).max(95),
});
export type OnboardingChatFinalizeInput = z.infer<typeof OnboardingChatFinalizeInput>;

export const ReportUserInput = z.object({
  reporteeId: z.string().uuid(),
  reason: z.enum([
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'FAKE_PROFILE',
    'SCAM',
    'MINOR',
    'VIOLENCE_THREAT',
    'OFF_PLATFORM_REDIRECT',
    'OTHER',
  ]),
  freeform: z.string().max(2000).optional(),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
});
export type ReportUserInput = z.infer<typeof ReportUserInput>;
