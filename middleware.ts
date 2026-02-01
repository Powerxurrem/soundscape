import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization')

  if (!auth) {
    return new Response('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected"',
      },
    })
  }

  const [, encoded] = auth.split(' ')
  const decoded = Buffer.from(encoded, 'base64').toString()
  const [user, pass] = decoded.split(':')

  if (
    user !== process.env.BASIC_AUTH_USER ||
    pass !== process.env.BASIC_AUTH_PASS
  ) {
    return new Response('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected"',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
