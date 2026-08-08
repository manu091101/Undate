/**
 * Password hashing (PBKDF2) + session token helpers.
 * Pure crypto — no D1. Uses Web Crypto (Workers + Node 19+).
 */

const ITERATIONS = 100_000;
const SALT_LEN = 16;
const HASH_LEN = 32;
const PREFIX = 'undate$v1$';

function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const raw = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    HASH_LEN * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(plaintext: string): Promise<string> {
  if (plaintext.length < 8) throw new Error('password_too_short');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const hash = await pbkdf2(plaintext, salt, ITERATIONS);
  const iterBuf = new Uint8Array(4);
  new DataView(iterBuf.buffer).setUint32(0, ITERATIONS, false);
  const packed = new Uint8Array(SALT_LEN + 4 + HASH_LEN);
  packed.set(salt, 0);
  packed.set(iterBuf, SALT_LEN);
  packed.set(hash, SALT_LEN + 4);
  return PREFIX + b64(packed);
}

export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  if (!stored.startsWith(PREFIX)) return false;
  try {
    const packed = fromB64(stored.slice(PREFIX.length));
    if (packed.length < SALT_LEN + 4 + HASH_LEN) return false;
    const salt = packed.slice(0, SALT_LEN);
    const iterations = new DataView(packed.buffer, packed.byteOffset + SALT_LEN, 4).getUint32(0, false);
    const expected = packed.slice(SALT_LEN + 4, SALT_LEN + 4 + HASH_LEN);
    const actual = await pbkdf2(plaintext, salt, iterations);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ expected[i]!;
    return diff === 0;
  } catch {
    return false;
  }
}

export function randomId(prefix = ''): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return prefix ? `${prefix}_${hex}` : hex;
}

export function randomToken(): string {
  return b64(crypto.getRandomValues(new Uint8Array(32)));
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const dig = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(dig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SessionClaims {
  sub: string;
  email: string;
  status: string;
  isAdmin: boolean;
  displayName: string;
}

/** HMAC-SHA256 signed session token: base64url(payload).base64url(sig) */
export async function signSession(claims: SessionClaims, secret: string, ttlSeconds = 60 * 60 * 24 * 7): Promise<string> {
  const payload = {
    ...claims,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return `${body}.${b64(sig)}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionClaims | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts as [string, string];
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify('HMAC', key, fromB64(sig) as BufferSource, new TextEncoder().encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64(body))) as SessionClaims & {
      exp?: number;
    };
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    return {
      sub: payload.sub,
      email: payload.email,
      status: payload.status ?? 'ACTIVE',
      isAdmin: payload.isAdmin === true,
      displayName: payload.displayName ?? 'Member',
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'undate_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function sessionCookieHeader(token: string, secure = true): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader(secure = true): string {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=') || null;
  }
  return null;
}
