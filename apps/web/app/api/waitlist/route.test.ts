import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma BEFORE importing the route, vitest hoists vi.mock calls.
const upsert = vi.fn();
vi.mock('@lumin/db', () => ({
  prisma: { waitlistEntry: { upsert: (...args: unknown[]) => upsert(...args) } },
}));

import { POST } from './route';

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    upsert.mockReset();
    upsert.mockImplementation(async ({ create }: { create: Record<string, unknown> }) => ({
      ...create,
      status: 'WAITING',
      referralCode: create.referralCode ?? 'LUMIN-TEST0001',
    }));
  });

  it('accepts a valid SG submission and persists', async () => {
    const res = await POST(makeReq({ email: 'beta@lumin.local', city: 'Singapore', region: 'SG' }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { email: string; status: string } };
    expect(json.ok).toBe(true);
    expect(json.data.email).toBe('beta@lumin.local');
    expect(json.data.status).toBe('WAITING');
    expect(upsert).toHaveBeenCalledOnce();
  });

  it('rejects an invalid email before touching the DB', async () => {
    const res = await POST(makeReq({ email: 'not-an-email', city: 'Mumbai', region: 'IN' }));
    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('defaults region to SG when omitted', async () => {
    const res = await POST(makeReq({ email: 'hello@lumin.local', city: 'Singapore' }));
    expect(res.status).toBe(200);
    const call = upsert.mock.calls[0]?.[0] as { create: { region: string } };
    expect(call.create.region).toBe('SG');
  });

  it('rejects unknown region', async () => {
    const res = await POST(makeReq({ email: 'x@lumin.local', region: 'MARS' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 if the DB write throws', async () => {
    upsert.mockRejectedValueOnce(new Error('boom'));
    const res = await POST(makeReq({ email: 'err@lumin.local', region: 'SG', city: 'SG' }));
    expect(res.status).toBe(500);
  });
});
