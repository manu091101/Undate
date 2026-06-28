import { describe, it, expect } from 'vitest';
import {
  PhoneE164,
  WaitlistJoinInput,
  ProfileDraftInput,
  SendMessageInput,
} from './schemas';

describe('PhoneE164', () => {
  it('accepts valid Singapore number', () => {
    expect(PhoneE164.safeParse('+6591234567').success).toBe(true);
  });
  it('accepts valid India number', () => {
    expect(PhoneE164.safeParse('+919876543210').success).toBe(true);
  });
  it('rejects numbers without +', () => {
    expect(PhoneE164.safeParse('6591234567').success).toBe(false);
  });
  it('rejects too-short', () => {
    expect(PhoneE164.safeParse('+65912').success).toBe(false);
  });
});

describe('WaitlistJoinInput', () => {
  it('lowercases email and accepts minimal input', () => {
    const out = WaitlistJoinInput.parse({ email: 'Test@Lumin.Local', region: 'SG' });
    expect(out.email).toBe('test@lumin.local');
  });
  it('rejects unknown region', () => {
    const res = WaitlistJoinInput.safeParse({ email: 'a@b.co', region: 'XX' });
    expect(res.success).toBe(false);
  });
});

describe('ProfileDraftInput', () => {
  it('enforces 21+ age floor', () => {
    const tooYoung = new Date();
    tooYoung.setFullYear(tooYoung.getFullYear() - 19);
    const res = ProfileDraftInput.safeParse({
      displayName: 'Aanya',
      dateOfBirth: tooYoung.toISOString(),
      gender: 'WOMAN',
      city: 'Singapore',
    });
    expect(res.success).toBe(false);
  });
  it('accepts a valid 28-year-old profile', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 28);
    const res = ProfileDraftInput.safeParse({
      displayName: 'Aanya',
      dateOfBirth: dob.toISOString(),
      gender: 'WOMAN',
      city: 'Singapore',
      bioShort: 'Architect, runner, slow reader.',
    });
    expect(res.success).toBe(true);
  });
});

describe('SendMessageInput', () => {
  it('rejects empty payload', () => {
    const res = SendMessageInput.safeParse({
      conversationId: '00000000-0000-0000-0000-000000000000',
    });
    expect(res.success).toBe(false);
  });
  it('accepts text-only', () => {
    const res = SendMessageInput.safeParse({
      conversationId: '00000000-0000-0000-0000-000000000000',
      body: 'Hello world',
    });
    expect(res.success).toBe(true);
  });
});
