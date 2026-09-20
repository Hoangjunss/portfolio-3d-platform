import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, hasValidSession } from "@/lib/auth";

const LOGIN_PATH = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  if (!hasValidSession(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
