import { NextRequest, NextResponse } from 'next/server';

// Admin hidden-URL gate per PRD locked decision #17.
//
// All admin pages live at `/{ADMIN_BASE_PATH}/...` where ADMIN_BASE_PATH is a
// 32-char URL-safe random slug stored in the env var. Probing /admin, /dashboard,
// /cms, /wp-admin etc. returns a real 404 — no hint that an admin surface exists.
//
// Layer 1 (this middleware): URL path gate.
// Layer 2 (API routes themselves): ADMIN_TOKEN bearer header required.

const ADMIN_PROBE_PATHS = [
  '/admin',
  '/dashboard',
  '/manage',
  '/cms',
  '/settings',
  '/wp-admin',
  '/wp-login.php',
  '/administrator',
  '/cpanel',
  '/.env',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminBasePath = process.env.ADMIN_BASE_PATH;

  // Explicit admin-probe 404s (no leak that admin exists)
  if (ADMIN_PROBE_PATHS.some((probe) => pathname === probe || pathname.startsWith(probe + '/'))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // If a configured ADMIN_BASE_PATH exists and the path starts with it, rewrite to /admin/*.
  // Strip the secret slug from the URL the React app sees.
  if (adminBasePath && (pathname === `/${adminBasePath}` || pathname.startsWith(`/${adminBasePath}/`))) {
    const internalPath = pathname.replace(`/${adminBasePath}`, '/admin') || '/admin';
    const url = req.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }

  // Block direct access to the internal /admin route (only reachable via the rewrite above)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals + public files
    '/((?!_next/static|_next/image|favicon.ico|legacy.html|robots.txt).*)',
  ],
};
