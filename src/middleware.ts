import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = pathname.startsWith("/login")
  const isAuthApi = pathname.startsWith("/api/auth")
  const isStaticAsset = pathname.startsWith("/_next") || pathname.includes(".")

  // Allow static assets and auth API routes
  if (isAuthApi || isStaticAsset) return NextResponse.next()

  try {
    // If on login page, redirect to dashboard if already authenticated
    if (isAuthPage) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      })
      if (token && token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return NextResponse.next()
    }

    // All other routes require authentication
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    if (token.role !== "ADMIN") {
      const url = new URL("/login", request.url)
      url.searchParams.set("error", "AccessDenied")
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("[Middleware Error]", error)
    // On middleware error, allow the request through — the page-level auth will handle it
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)",
  ],
}
