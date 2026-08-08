/**
 * Generate PBKDF2 password hash compatible with src/lib/auth.ts for seed SQL.
 */
import { webcrypto } from 'node:crypto';

const crypto = webcrypto;
const ITERATIONS = 100_000;
const SALT_LEN = 16;
const HASH_LEN = 32;
const PREFIX = 'undate$v1$';

function b64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashPassword(plaintext) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(plaintext), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_LEN * 8,
  );
  const hash = new Uint8Array(bits);
  const iterBuf = new Uint8Array(4);
  new DataView(iterBuf.buffer).setUint32(0, ITERATIONS, false);
  const packed = new Uint8Array(SALT_LEN + 4 + HASH_LEN);
  packed.set(salt, 0);
  packed.set(iterBuf, SALT_LEN);
  packed.set(hash, SALT_LEN + 4);
  return PREFIX + b64(packed);
}

const pwd = process.argv[2] || 'undate-demo-2026';
const h = await hashPassword(pwd);
console.log(h);
