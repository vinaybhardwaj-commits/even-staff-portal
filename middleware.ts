import { NextRequest, NextResponse } from 'next/server';

// Admin hidden-URL gate per PRD locked decision #17 + SP.8 CDMSS redirect.
//
// Layer 1 (this middleware):
//   a) URL path gate for admin (hidden-URL rewrite + probe 404s).
//   b) CDMSS-route redirect for SP.8 cutover: after even-cdmss.vercel.app
//      reassigns to the staff-portal project, requests to /ask /ddx /drugs
//      /coach /calculators /review (and sub-paths) at this project's host
//      bounce 302 to the stable CDMSS underlying alias, preserving query
//      strings + paths.
//
// Layer 2 (API routes): ADMIN_TOKEN bearer header required for admin endpoints.

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

// CDMSS clinical-tool routes. After SP.8 alias reassignment, even-cdmss.vercel.app
// resolves to THIS project, so we 302 these paths back to the project-level alias
// that stays with CDMSS regardless of vanity-alias movement.
const CDMSS_ROUTES = ['/ask', '/ddx', '/drugs', '/coach', '/calculators', '/review'];
const CDMSS_TARGET_HOST = 'https://even-cdmss-vinaybhardwaj-commits-projects.vercel.app';

function isCdmssRoute(pathname: string): boolean {
  return CDMSS_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const adminBasePath = process.env.ADMIN_BASE_PATH;

  // Explicit admin-probe 404s (no leak that admin exists)
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

  // Block direct /admin access (only reachable via the rewrite above)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // SP.8 cutover: redirect CDMSS clinical-tool paths to the stable CDMSS deployment URL.
  // Lives in middleware (not next.config redirects) so the rule sits next to other
  // request-time routing logic and can evolve into a proxy in v1.x when CDMSS subtree-merges.
  if (isCdmssRoute(pathname)) {
    return NextResponse.redirect(`${CDMSS_TARGET_HOST}${pathname}${search}`, 302);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals + public files
    '/((?!_next/static|_next/image|favicon.ico|legacy.html|robots.txt).*)',
  ],
};
