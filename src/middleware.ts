import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// HOW THIS WORKS:
// Next.js middleware runs BEFORE every matched request.
// `withAuth` from next-auth wraps our middleware with JWT checking.
// The token (from the JWT cookie) is available as req.nextauth.token.
//
// WHY role-based checks here:
// Instead of just checking "is user logged in?", we check their ROLE.
// - /admin/* routes → only ADMIN can access
// - /teacher/* routes → only TEACHER can access
// If wrong role, we redirect to /login instead of showing the page.

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes: only ADMIN role allowed
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Teacher routes: only TEACHER role allowed
    if (pathname.startsWith("/teacher") && token?.role !== "TEACHER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // This runs first — if it returns false, the user gets a 401.
      // We return true if user has ANY valid token (is logged in).
      // The role-specific checks happen in the middleware function above.
      authorized: ({ token }) => !!token,
    },
  }
);

// MATCHER: Only run middleware on these paths (for performance).
// Routes not listed here skip middleware entirely.
export const config = {
  matcher: ["/teacher/:path*", "/admin/:path*"],
};
