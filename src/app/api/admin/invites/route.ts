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
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || ""

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [items, total] = await Promise.all([
      db.companyInvite.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.companyInvite.count({ where }),
    ])

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("[GET /api/admin/invites]", error)
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id, status } = body
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const data: Record<string, string> = {}
    if (status) data.status = status

    const item = await db.companyInvite.update({
      where: { id },
      data,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("[PATCH /api/admin/invites]", error)
    return NextResponse.json({ error: "Failed to update invite" }, { status: 500 })
  }
}
