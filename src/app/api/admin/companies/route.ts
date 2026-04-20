import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

async function verifyAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== "ADMIN") return null
  return token
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, ...data } = body
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    const item = await db.company.create({
      data: {
        name,
        slug,
        ...data,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/companies]", error)
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const plan = searchParams.get("plan") || ""
    const status = searchParams.get("status") || ""
    const verified = searchParams.get("verified") || ""
    const featured = searchParams.get("featured") || ""
    const sort = searchParams.get("sort") || "newest"

    // Build where clause
    const conditions: Record<string, unknown>[] = []
    if (search) conditions.push({ name: { contains: search } })
    if (status === "ACTIVE") conditions.push({ isActive: true })
    if (status === "INACTIVE") conditions.push({ isActive: false })
    if (verified === "true") conditions.push({ isVerified: true })
    if (verified === "false") conditions.push({ isVerified: false })
    if (featured === "true") conditions.push({ isFeatured: true })
    if (featured === "false") conditions.push({ isFeatured: false })

    // Plan filter — FREE means no subscription record
    if (plan) {
      if (plan === "FREE") {
        conditions.push({ subscription: { is: null } })
      } else {
        conditions.push({ subscription: { plan } })
      }
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

    // Build sort
    const orderByMap: Record<string, Record<string, string>> = {
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      name_asc: { name: "asc" },
      name_desc: { name: "desc" },
      jobs_desc: { jobCount: "desc" },
    }
    const orderBy = orderByMap[sort] || { createdAt: "desc" }

    const [companies, total, summaryTotal, summaryActive, summaryVerified] = await Promise.all([
      db.company.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          members: {
            where: { status: "ACTIVE" },
            select: { role: true, user: { select: { name: true } } },
          },
          subscription: {
            select: { plan: true, status: true },
          },
        },
      }),
      db.company.count({ where }),
      db.company.count({}),
      db.company.count({ where: { isActive: true } }),
      db.company.count({ where: { isVerified: true } }),
    ])

    const items = companies.map((company) => {
      const owner = company.members.find((m) => m.role === "OWNER")
      return {
        ...company,
        members: undefined,
        subscription: undefined,
        owner: owner?.user?.name || null,
        teamSize: company.members.length,
        plan: company.subscription?.plan || "FREE",
      }
    })

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        total: summaryTotal,
        active: summaryActive,
        verified: summaryVerified,
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/companies]", error)
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const item = await db.company.update({ where: { id }, data })
    return NextResponse.json(item)
  } catch (error) {
    console.error("[PATCH /api/admin/companies]", error)
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}
