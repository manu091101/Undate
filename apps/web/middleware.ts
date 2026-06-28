// Edge middleware: gate protected routes server-side BEFORE the page renders.
// Reads the same httpOnly session cookie as the Route Handlers; uses `jose`
// (edge-safe) to verify the JWT without hitting the DB.

import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_PREFIXES = ['/dashboard', '/onboarding', '/matches', '/profile', '/conversations'];
const AUTH_ONLY_PREFIXES = ['/login', '/signup'];
const COOKIE_NAME = 'lumin_session';

function secretKey(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  return new TextEncoder().encode(
    secret ?? 'dev-only-access-secret-64-chars-do-not-use-this-in-production-xxxx',
  );
}

interface Claims {
  authed: boolean;
  isAdmin: boolean;
}

async function readClaims(req: NextRequest): Promise<Claims> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return { authed: false, isAdmin: false };
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: 'lumin',
      audience: 'lumin-web',
    });
    return { authed: true, isAdmin: payload.isAdmin === true };
  } catch {
    return { authed: false, isAdmin: false };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { authed, isAdmin } = await readClaims(req);

  // Admin dashboard: must be signed in AND flagged admin.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // If logged in, bounce away from /login + /signup to the dashboard.
  if (AUTH_ONLY_PREFIXES.some((p) => pathname === p) && authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/matches/:path*',
    '/profile/:path*',
    '/conversations/:path*',
    '/login',
    '/signup',
  ],
};
