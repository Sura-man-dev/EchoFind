import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicPages = new Set([
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/faq",
  "/privacy-policy",
  "/terms-of-service",
]);

const authProxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isPublicPage = publicPages.has(pathname);

  if (request.auth?.user) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (isPublicPage) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
});

export default function proxy(request, event) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204 });
  }

  return authProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|jfif|css|js|woff2?)$).*)",
  ],
};
