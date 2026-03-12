import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth

    // If user is not onboarded and trying to access dashboard
    if (pathname === "/dashboard" && token && !token.isOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    // If user is onboarded and trying to access onboarding
    if (pathname === "/onboarding" && token && token.isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow access to landing page and auth pages without token
        if (req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/auth")) {
          return true
        }
        return token !== null
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard", "/onboarding", "/api/profile", "/api/jobs/:path*"],
}
