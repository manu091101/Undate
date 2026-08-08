import { describe, expect, it } from 'vitest';
import {
  attachmentFit,
  rank,
  scorePair,
  type UserFeatures,
} from '../src/lib/matching';

function member(partial: Partial<UserFeatures> & { userId: string }): UserFeatures {
  return {
    age: 29,
    gender: 'WOMAN',
    city: 'Singapore',
    region: 'SG',
    relationshipGoal: 'SERIOUS_DATING',
    attachment: 'SECURE',
    wantsKids: 'OPEN',
    bigFive: [0.7, 0.7, 0.5, 0.75, 0.3],
    communicationStyle: 'REFLECTIVE',
    mbti: 'INFJ',
    ...partial,
  };
}

describe('matching algorithm (shipped pure module)', () => {
  it('scores secure-secure attachment higher than anxious-avoidant', () => {
    expect(attachmentFit('SECURE', 'SECURE')).toBeGreaterThan(attachmentFit('ANXIOUS', 'AVOIDANT'));
  });

  it('ranks a goal-aligned peer above a marriage/exploring mismatch', () => {
    const anchor = member({
      userId: 'a',
      relationshipGoal: 'MARRIAGE',
      attachment: 'SECURE',
      wantsKids: 'YES',
    });
    const good = member({
      userId: 'b',
      gender: 'MAN',
      relationshipGoal: 'LIFE_PARTNER',
      attachment: 'SECURE',
      wantsKids: 'YES',
      bigFive: [0.68, 0.72, 0.48, 0.8, 0.28],
    });
    const bad = member({
      userId: 'c',
      gender: 'MAN',
      relationshipGoal: 'EXPLORING',
      attachment: 'AVOIDANT',
      wantsKids: 'NO',
      bigFive: [0.4, 0.4, 0.8, 0.4, 0.85],
    });
    const ranked = rank(anchor, [good, bad], 2);
    expect(ranked[0]!.userId).toBe('b');
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
    expect(scorePair(anchor, good).score).toBeGreaterThan(0.5);
  });

  it('returns breakdown axes used by match narratives', () => {
    const a = member({ userId: 'x' });
    const b = member({ userId: 'y', gender: 'MAN' });
    const r = scorePair(a, b);
    expect(r.breakdown.attachment).toBeGreaterThan(0);
    expect(r.breakdown.goal).toBeGreaterThan(0);
    expect(Object.keys(r.breakdown).length).toBe(9);
  });
});
