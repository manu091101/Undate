// Undate auth primitives. Production-credible building blocks; demo-friendly defaults.
//
//   hashPassword / verifyPassword , bcrypt 12 rounds, locked to ascii passwords ≤ 72 bytes
//   signSession / verifySession   , HS256 JWT via jose, 7-day expiry, edge-safe
//   getSession / requireSession   , read the httpOnly cookie in Route Handlers + RSC
//   setSessionCookie / clearSessionCookie, single source of truth for the cookie surface
//
// Production Phase 1 will replace this with passkey + OTP + refresh-token rotation
// (see docs/SECURITY_AUDIT.md). This module is intentionally small and replaceable.

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'lumin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_ACCESS_SECRET must be set in production');
    }
    // Dev fallback, printed on every server boot so it's obvious.
    return new TextEncoder().encode(
      'dev-only-access-secret-64-chars-do-not-use-this-in-production-xxxx',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plaintext: string): Promise<string> {
  if (plaintext.length < 8) throw new Error('password_too_short');
  if (plaintext.length > 72) throw new Error('password_too_long');
  return bcrypt.hash(plaintext, 12);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export interface SessionClaims {
  sub: string; // user id
  email?: string;
  status: string;
  region: string;
  isAdmin?: boolean;
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer('lumin')
    .setAudience('lumin-web')
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'lumin',
      audience: 'lumin-web',
    });
    if (typeof payload.sub !== 'string') return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      status: typeof payload.status === 'string' ? payload.status : 'ACTIVE',
      region: typeof payload.region === 'string' ? payload.region : 'SG',
      isAdmin: payload.isAdmin === true,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionClaims> {
  const session = await getSession();
  if (!session) throw new Response('Unauthorized', { status: 401 });
  return session;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
