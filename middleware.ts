import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization');

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  if (!auth) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected"',
      },
    });
  }

  const [, encoded] = auth.split(' ');
  const decoded = Buffer.from(encoded, 'base64').toString();
  const [u, p] = decoded.split(':');

  if (u !== user || p !== pass) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',        // homepage
    '/about',
    '/pricing',
    '/trips',
    '/mixer',
    '/autopilot',
  ],
};
