import { NextRequest, NextResponse } from 'next/server';

// Admin hidden-URL gate per PRD locked decision #17.
// v1.2: CDMSS subtree-merged into staff-portal — clinical tools (/ask /ddx /drugs
// /coach /calculators /review) are now first-class internal routes served from
// the (cdmss) route group. SP.8 redirect logic deleted in v1.2 T1.

const ADMIN_PROBE_PATHS = [
  '/dashboard',
  '/manage',
  '/cms',
  '/wp-admin',
  '/wp-login.php',
  '/administrator',
  '/cpanel',
  '/.env',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminBasePath = process.env.ADMIN_BASE_PATH;

  // Explicit admin-probe 404s (no leak that admin exists).
  // NOTE: removed '/settings' from probes in v1.2 — would have collided with
  // the v1.1 admin Settings page (which is reached at /<ADMIN_BASE_PATH>/settings,
  // but the bare '/settings' probe-block was overly broad).
  if (ADMIN_PROBE_PATHS.some((probe) => pathname === probe || pathname.startsWith(probe + '/'))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // If a configured ADMIN_BASE_PATH exists and the path starts with it, rewrite to /admin/*.
  if (adminBasePath && (pathname === `/${adminBasePath}` || pathname.startsWith(`/${adminBasePath}/`))) {
    const internalPath = pathname.replace(`/${adminBasePath}`, '/admin') || '/admin';
    const url = req.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|legacy.html|robots.txt).*)',
  ],
};
