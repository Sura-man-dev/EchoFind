import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicAuthPages = new Set(["/login", "/register", "/reset-password"]);

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isAuthPage = publicAuthPages.has(pathname);

  if (request.auth?.user) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (isAuthPage) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|jfif|css|js|woff2?)$).*)",
  ],
};
