import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth

    // Public paths
    if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/_next")) {
      return NextResponse.next()
    }

    // Check authentication
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow public paths
        if (req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/auth")) {
          return true
        }
        // Require token for protected paths
        return token !== null
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard", "/onboarding", "/api/profile", "/api/jobs/:path*"],
}
