import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

async function verifyAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== "ADMIN") return null
  return token
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    // Check company exists
    const company = await db.company.findUnique({ where: { id }, select: { id: true } })
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")))
    const skip = (page - 1) * limit

    // Get summary stats
    const ledgerEntries = await db.companyCreditLedger.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
    })

    const totalAdded = ledgerEntries
      .filter((e) => e.credits > 0)
      .reduce((sum, e) => sum + e.credits, 0)

    const totalDeducted = ledgerEntries
      .filter((e) => e.credits < 0)
      .reduce((sum, e) => sum + Math.abs(e.credits), 0)

    const currentBalance = ledgerEntries.length > 0
      ? ledgerEntries[0].balanceAfter
      : 0

    // Get paginated entries
    const entries = await db.companyCreditLedger.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    const total = await db.companyCreditLedger.count({
      where: { companyId: id },
    })

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalAdded,
        totalDeducted,
        currentBalance,
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/companies/[id]/credits]", error)
    return NextResponse.json({ error: "Failed to fetch credit ledger" }, { status: 500 })
  }
}
