import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "dertlyu_uid";

function createAnonId() {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let id = "anon_";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  for (const byte of bytes) {
    id += alphabet[byte % alphabet.length];
  }
  return id;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (!existing || !/^[A-Za-z0-9_-]{8,128}$/.test(existing)) {
    response.cookies.set({
      name: SESSION_COOKIE,
      value: createAnonId(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
