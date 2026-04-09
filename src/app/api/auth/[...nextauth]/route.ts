import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { headers } from 'next/headers'

// Dynamic handler that forces NEXTAUTH_URL to match the actual request origin.
// This fixes the cookie domain mismatch when NEXTAUTH_URL env var points to a
// different domain (e.g. custom domain) than the current request (e.g. Vercel default).
async function handler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  // Get the actual request origin from headers
  const headersList = await headers()
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const host = headersList.get('host') || ''
  const actualUrl = `${protocol}://${host}`

  // Temporarily override NEXTAUTH_URL so NextAuth uses the correct domain
  process.env.NEXTAUTH_URL = actualUrl

  // Also set NEXTAUTH_URL as origin for CORS and redirects
  const authHandler = NextAuth({
    ...authOptions,
  })

  return authHandler(req, ctx)
}

export { handler as GET, handler as POST }
