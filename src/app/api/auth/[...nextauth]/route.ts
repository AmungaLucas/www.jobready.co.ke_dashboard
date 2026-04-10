import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { headers } from "next/headers"

async function handler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const headersList = await headers()
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const host = headersList.get("host") || ""
  process.env.NEXTAUTH_URL = `${protocol}://${host}`

  const authHandler = NextAuth({ ...authOptions })
  return authHandler(req, ctx)
}

export { handler as GET, handler as POST }
