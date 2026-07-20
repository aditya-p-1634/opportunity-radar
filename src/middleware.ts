import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/onboarding",
  "/saved",
  "/applied",
  "/notifications",
  "/admin",
];

const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPage = authPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isAdminPath && isLoggedIn && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Security headers
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/saved/:path*",
    "/applied/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
