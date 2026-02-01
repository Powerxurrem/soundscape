import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Soundscape (staging)"',
    },
  });
}

export function middleware(req: NextRequest) {
  // Allow Next internals + static assets through
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  // Turn protection on/off with an env var
  if (process.env.BASIC_AUTH_ENABLED !== "true") {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const base64 = auth.slice("Basic ".length);
  let userPass = "";
  try {
    userPass = Buffer.from(base64, "base64").toString();
  } catch {
    return unauthorized();
  }

  const [user, pass] = userPass.split(":");
  const ok =
    user === process.env.BASIC_AUTH_USER &&
    pass === process.env.BASIC_AUTH_PASS;

  if (!ok) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
