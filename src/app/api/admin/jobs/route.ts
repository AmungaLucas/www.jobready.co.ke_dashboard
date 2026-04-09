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
  const employmentType = searchParams.get("employmentType") || ""
  const experienceLevel = searchParams.get("experienceLevel") || ""

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { company: { name: { contains: search } } },
    ]
  }
  if (status) where.status = status
  if (employmentType) where.employmentType = employmentType
  if (experienceLevel) where.experienceLevel = experienceLevel

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      include: {
        company: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.job.count({ where }),
  ])

  return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Generate slug
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const job = await db.job.create({
    data: {
      title: body.title,
      slug,
      description: body.description || "",
      shortDescription: body.shortDescription,
      featuredImage: body.featuredImage,
      companyId: body.companyId,
      country: body.country || "Kenya",
      county: body.county,
      town: body.town,
      isRemote: body.isRemote || false,
      salaryMin: body.salaryMin ? parseInt(body.salaryMin) : null,
      salaryMax: body.salaryMax ? parseInt(body.salaryMax) : null,
      salaryCurrency: body.salaryCurrency || "KES",
      salaryPeriod: body.salaryPeriod || "MONTHLY",
      isSalaryNegotiable: body.isSalaryNegotiable || false,
      employmentType: body.employmentType,
      experienceLevel: body.experienceLevel,
      industry: body.industry,
      positions: body.positions || 1,
      applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : null,
      howToApply: body.howToApply,
      createdBy: admin.id as string,
      status: body.status || "DRAFT",
      isFeatured: body.isFeatured || false,
      isActive: body.status === "PUBLISHED",
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      categories: body.categories || null,
      tags: body.tags || null,
    },
    include: { company: { select: { name: true } } },
  })

  return NextResponse.json(job, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body

  if (!id) return NextResponse.json({ error: "Job ID required" }, { status: 400 })

  const updateData: Record<string, unknown> = { ...data }
  if (data.status === "PUBLISHED" && !data.publishedAt) {
    updateData.isActive = true
    updateData.publishedAt = new Date()
  }
  if (data.salaryMin) updateData.salaryMin = parseInt(data.salaryMin)
  if (data.salaryMax) updateData.salaryMax = parseInt(data.salaryMax)
  if (data.positions) updateData.positions = parseInt(data.positions)
  if (data.applicationDeadline) updateData.applicationDeadline = new Date(data.applicationDeadline)

  const job = await db.job.update({
    where: { id },
    data: updateData,
    include: { company: { select: { name: true } } },
  })

  return NextResponse.json(job)
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ error: "Job ID required" }, { status: 400 })

  await db.job.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
