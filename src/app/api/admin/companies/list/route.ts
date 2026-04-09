import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

async function verifyAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== "ADMIN") return null
  return token
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""

  const where: Record<string, unknown> = {}
  if (search) where.name = { contains: search }

  const companies = await db.company.findMany({
    where,
    select: { id: true, name: true, slug: true },
    take: 50,
    orderBy: { name: "asc" },
  })

  return NextResponse.json(companies)
}
