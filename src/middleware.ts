import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Get session token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production"
  })

  // Public paths that don't require authentication
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  // If user is not onboarded and trying to access dashboard
  if (pathname === "/dashboard" && !token.isOnboarded) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  // If user is onboarded and trying to access onboarding
  if (pathname === "/onboarding" && token.isOnboarded) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard", "/onboarding", "/api/profile", "/api/jobs/:path*", "/api/cover-letter", "/api/send-email"],
}
