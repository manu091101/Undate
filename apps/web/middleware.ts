// Edge middleware for the pitch + waitlist product.
// Public signup/signin are retired; old auth URLs and member areas bounce to waitlist/home.

import { NextResponse, type NextRequest } from 'next/server';

const MEMBER_PREFIXES = [
  '/dashboard',
  '/onboarding',
  '/matches',
  '/profile',
  '/conversations',
  '/login',
  '/signup',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin is not a public product surface; send visitors to waitlist (no login page).
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/waitlist';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (MEMBER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = '/waitlist';
    url.search = '';
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
