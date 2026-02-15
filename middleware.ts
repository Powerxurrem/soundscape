import { NextRequest, NextResponse } from 'next/server';

const MOBILE_PATH = '/mobile';

// Skip redirect for these routes
const SKIP_PREFIXES = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/icons',
  '/images',
];

// Very basic UA check (good enough for gating)
function isMobileUA(ua: string) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === MOBILE_PATH) return NextResponse.next();
  if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Let users bypass gate if they want
  const bypass = req.nextUrl.searchParams.get('desktop') === '1';
  if (bypass) return NextResponse.next();

  const ua = req.headers.get('user-agent') || '';
  if (!isMobileUA(ua)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = MOBILE_PATH;

  // keep track of where they were trying to go
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
