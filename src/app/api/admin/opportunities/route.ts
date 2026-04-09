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
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const type = searchParams.get("type") || ""

  const where: Record<string, unknown> = {}
  if (search) where.title = { contains: search }
  if (status) where.status = status
  if (type) where.opportunityType = type

  const [items, total] = await Promise.all([
    db.opportunity.findMany({
      where,
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.opportunity.count({ where }),
  ])

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Generate slug from title
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const opportunity = await db.opportunity.create({
    data: {
      title: body.title,
      slug,
      description: body.description || "",
      excerpt: body.excerpt,
      featuredImage: body.featuredImage,
      companyId: body.companyId || null,
      opportunityType: body.opportunityType,
      deadline: body.deadline ? new Date(body.deadline) : null,
      howToApply: body.howToApply,
      tags: body.tags || null,
      status: body.status || "DRAFT",
      isFeatured: body.isFeatured || false,
      isActive: body.isActive !== undefined ? body.isActive : true,
      noIndex: body.noIndex || false,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      ogImage: body.ogImage,
      createdBy: admin.id as string,
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
    },
    include: { company: { select: { name: true } } },
  })

  return NextResponse.json(opportunity, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  if (data.status === "PUBLISHED" && !data.publishedAt) {
    data.isActive = true
    data.publishedAt = new Date()
  }

  const item = await db.opportunity.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  await db.opportunity.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
