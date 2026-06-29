// TypeScript port of ml/lumin_ml/features.py + cold_start_ranker.py.
// Identical weights and rationale so the API can rank live until the
// LightGBM model trained from curator labels takes over.
//
// All claims here are anchored to peer-reviewed literature:
//   - Joel, Eastwick et al. 2020 (PNAS), pre-meeting similarity is weak signal
//   - Karney & Bradbury 1995/2020, VSA model (stress + adaptive processes)
//   - Malouff 2010 meta-analysis, neuroticism predicts dissolution (r ≈ -.22)
//   - Mikulincer & Shaver 2016, attachment-style pairing matrix
//   - Schwartz 1992, Roccas & Sagiv 2010, values congruence
//   - Gere & Schimmack 2013, goal congruence (kids/marriage) is a hard filter

// Re-use the enum string-literal types from enums.ts so we don't double-declare.
import type { AttachmentStyle, RelationshipGoal } from './enums';
export type KidsPref = 'YES' | 'NO' | 'OPEN' | 'HAVE_WANT_MORE' | 'HAVE_DONE' | 'UNKNOWN';

export interface UserFeatures {
  userId: string;
  age: number;
  gender: string;
  city: string;
  region: string;
  relationshipGoal: RelationshipGoal;
  attachment: AttachmentStyle;
  /** [openness, conscientiousness, extraversion, agreeableness, neuroticism], each 0..1 */
  bigFive?: number[];
  /** 10-dim Schwartz values vector, each 0..1 (achievement, benevolence, conformity,
   *  hedonism, power, security, self-direction, stimulation, tradition, universalism) */
  valuesVec?: number[];
  wantsKids: KidsPref;
  /** DIRECT | GENTLE | PLAYFUL | REFLECTIVE | ANALYTICAL */
  communicationStyle?: string;
  /** 16-type Myers-Briggs code, e.g. "INFJ" */
  mbti?: string;
}

const ATTACHMENT_MATRIX: Record<string, number> = {
  // Always store with sorted keys so order doesn't matter.
  'SECURE|SECURE': 1.0,
  'ANXIOUS|SECURE': 0.75,
  'AVOIDANT|SECURE': 0.65,
  'DISORGANIZED|SECURE': 0.55,
  'ANXIOUS|ANXIOUS': 0.35,
  'ANXIOUS|AVOIDANT': 0.25, // the trap pairing
  'ANXIOUS|DISORGANIZED': 0.3,
  'AVOIDANT|AVOIDANT': 0.4,
  'AVOIDANT|DISORGANIZED': 0.3,
  'DISORGANIZED|DISORGANIZED': 0.2,
};

export function attachmentFit(a: AttachmentStyle, b: AttachmentStyle): number {
  if (a === 'UNKNOWN' || b === 'UNKNOWN') return 0.5;
  const key = [a, b].sort().join('|');
  return ATTACHMENT_MATRIX[key] ?? 0.5;
}

export function goalAlignment(a: UserFeatures, b: UserFeatures): number {
  if (a.relationshipGoal === b.relationshipGoal) return 1.0;
  const serious = new Set(['MARRIAGE', 'LIFE_PARTNER', 'SERIOUS_DATING']);
  if (serious.has(a.relationshipGoal) && serious.has(b.relationshipGoal)) return 0.85;
  const pair = new Set([a.relationshipGoal, b.relationshipGoal]);
  if (pair.has('MARRIAGE') && pair.has('EXPLORING')) return 0.2;
  return 0.6;
}

export function kidsAlignment(a: UserFeatures, b: UserFeatures): number {
  if (a.wantsKids === 'UNKNOWN' || b.wantsKids === 'UNKNOWN') return 0.5;
  if (a.wantsKids === b.wantsKids) return 1.0;
  const pair = new Set([a.wantsKids, b.wantsKids]);
  if (pair.has('YES') && pair.has('NO')) return 0.05; // near hard-filter
  if (pair.has('OPEN')) return 0.7;
  return 0.5;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}
function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

const VALUES_WEIGHTS = [0.6, 1.0, 0.8, 0.4, 0.4, 0.9, 0.6, 0.4, 0.9, 1.0];

export function valuesCongruence(a: UserFeatures, b: UserFeatures): number {
  if (!a.valuesVec || !b.valuesVec) return 0.5;
  const va = a.valuesVec.map((v, i) => v * (VALUES_WEIGHTS[i] ?? 1));
  const vb = b.valuesVec.map((v, i) => v * (VALUES_WEIGHTS[i] ?? 1));
  const na = norm(va);
  const nb = norm(vb);
  if (na === 0 || nb === 0) return 0.5;
  return Math.max(0, Math.min(1, dot(va, vb) / (na * nb)));
}

export function neuroticismRisk(a: UserFeatures, b: UserFeatures): number {
  if (!a.bigFive || !b.bigFive) return 0.7;
  const na = a.bigFive[4] ?? 0.5;
  const nb = b.bigFive[4] ?? 0.5;
  if (na > 0.75 && nb > 0.75) return 0.3;
  if (Math.max(na, nb) > 0.8) return 0.55;
  return 0.85;
}

export function ageCompat(a: UserFeatures, b: UserFeatures): number {
  const diff = Math.abs(a.age - b.age);
  return Math.exp(-((diff / 6) ** 2));
}

// Trait harmony beyond neuroticism. Similarity in openness, conscientiousness
// and agreeableness modestly predicts satisfaction (Dyrenforth et al. 2010);
// two agreeable people get an extra nudge. Extraversion difference is tolerated.
export function traitHarmony(a: UserFeatures, b: UserFeatures): number {
  if (!a.bigFive || !b.bigFive) return 0.6;
  const [oa, ca, , aa] = a.bigFive;
  const [ob, cb, , ab] = b.bigFive;
  const sim = (x = 0.5, y = 0.5) => 1 - Math.abs(x - y);
  // weight openness + agreeableness a touch more than conscientiousness
  let h = 0.35 * sim(oa, ob) + 0.25 * sim(ca, cb) + 0.4 * sim(aa, ab);
  if ((aa ?? 0.5) > 0.6 && (ab ?? 0.5) > 0.6) h += 0.08; // two warm people
  return Math.max(0, Math.min(1, h));
}

// Conversation-style affinity (gentle nudge). Same style is comfortable;
// some cross-pairs complement, a few grate. 5×5 symmetric, 0..1.
const COMM_STYLES = ['DIRECT', 'GENTLE', 'PLAYFUL', 'REFLECTIVE', 'ANALYTICAL'] as const;
const COMM_MATRIX: Record<string, number> = {
  'DIRECT|DIRECT': 0.8, 'DIRECT|GENTLE': 0.55, 'DIRECT|PLAYFUL': 0.7, 'DIRECT|REFLECTIVE': 0.6, 'ANALYTICAL|DIRECT': 0.8,
  'GENTLE|GENTLE': 0.85, 'GENTLE|PLAYFUL': 0.75, 'GENTLE|REFLECTIVE': 0.85, 'ANALYTICAL|GENTLE': 0.6,
  'PLAYFUL|PLAYFUL': 0.85, 'PLAYFUL|REFLECTIVE': 0.65, 'ANALYTICAL|PLAYFUL': 0.6,
  'REFLECTIVE|REFLECTIVE': 0.85, 'ANALYTICAL|REFLECTIVE': 0.75,
  'ANALYTICAL|ANALYTICAL': 0.8,
};
export function commStyleFit(a: UserFeatures, b: UserFeatures): number {
  if (!a.communicationStyle || !b.communicationStyle) return 0.6;
  const x = a.communicationStyle.toUpperCase();
  const y = b.communicationStyle.toUpperCase();
  if (!COMM_STYLES.includes(x as never) || !COMM_STYLES.includes(y as never)) return 0.6;
  const key = [x, y].sort().join('|');
  return COMM_MATRIX[key] ?? 0.65;
}

// MBTI affinity. Derived from Big Five, so kept light. Shared intuition/sensing
// (middle of the "communication" debate) and shared values-letter help; opposite
// energy (E/I) and structure (J/P) can complement.
export function mbtiAffinity(a: UserFeatures, b: UserFeatures): number {
  if (!a.mbti || !b.mbti || a.mbti.length !== 4 || b.mbti.length !== 4) return 0.5;
  const x = a.mbti.toUpperCase();
  const y = b.mbti.toUpperCase();
  let s = 0.5;
  if (x[1] === y[1]) s += 0.15; // same N/S, how you take in the world
  if (x[2] === y[2]) s += 0.1; // same F/T, how you decide
  if (x[0] !== y[0]) s += 0.1; // complementary E/I
  if (x[3] !== y[3]) s += 0.05; // complementary J/P
  return Math.max(0, Math.min(1, s));
}

export interface CompatibilityBreakdown {
  attachment: number;
  goal: number;
  kids: number;
  values: number;
  neuroticismRisk: number;
  traitHarmony: number;
  commStyle: number;
  mbti: number;
  age: number;
}

export interface RankedCandidate {
  userId: string;
  score: number;
  breakdown: CompatibilityBreakdown;
}

const WEIGHTS = {
  attachment: 0.22,
  goal: 0.18,
  kids: 0.15,
  values: 0.12,
  neuroticismRisk: 0.1,
  traitHarmony: 0.08,
  commStyle: 0.06,
  mbti: 0.04,
  age: 0.05,
} as const;

export function computeBreakdown(a: UserFeatures, b: UserFeatures): CompatibilityBreakdown {
  return {
    attachment: attachmentFit(a.attachment, b.attachment),
    goal: goalAlignment(a, b),
    kids: kidsAlignment(a, b),
    values: valuesCongruence(a, b),
    neuroticismRisk: neuroticismRisk(a, b),
    traitHarmony: traitHarmony(a, b),
    commStyle: commStyleFit(a, b),
    mbti: mbtiAffinity(a, b),
    age: ageCompat(a, b),
  };
}

export function score(a: UserFeatures, b: UserFeatures): RankedCandidate {
  const br = computeBreakdown(a, b);
  const s =
    WEIGHTS.attachment * br.attachment +
    WEIGHTS.goal * br.goal +
    WEIGHTS.kids * br.kids +
    WEIGHTS.values * br.values +
    WEIGHTS.neuroticismRisk * br.neuroticismRisk +
    WEIGHTS.traitHarmony * br.traitHarmony +
    WEIGHTS.commStyle * br.commStyle +
    WEIGHTS.mbti * br.mbti +
    WEIGHTS.age * br.age;
  return { userId: b.userId, score: s, breakdown: br };
}

export function rank(
  anchor: UserFeatures,
  candidates: UserFeatures[],
  topK = 5,
): RankedCandidate[] {
  return candidates
    .filter((c) => c.userId !== anchor.userId)
    .map((c) => score(anchor, c))
    .sort((x, y) => y.score - x.score)
    .slice(0, topK);
}

export function explainTopAxes(br: CompatibilityBreakdown): string[] {
  const entries: [keyof CompatibilityBreakdown, number, string][] = [
    ['attachment', br.attachment, 'attachment-style fit'],
    ['goal', br.goal, 'relationship goals'],
    ['kids', br.kids, 'children plans'],
    ['values', br.values, 'values overlap'],
    ['neuroticismRisk', br.neuroticismRisk, 'emotional stability balance'],
    ['traitHarmony', br.traitHarmony, 'temperament harmony'],
    ['commStyle', br.commStyle, 'conversation style'],
    ['mbti', br.mbti, 'personality type fit'],
    ['age', br.age, 'age proximity'],
  ];
  return entries
    .filter(([, v]) => v >= 0.7)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([, , label]) => label);
}
