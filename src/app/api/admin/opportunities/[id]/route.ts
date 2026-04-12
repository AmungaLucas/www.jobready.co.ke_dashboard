import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
    }

    const opportunity = await db.opportunity.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true, slug: true } } },
    })

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error("[GET /api/admin/opportunities/[id]]", error)
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    )
  }
}
