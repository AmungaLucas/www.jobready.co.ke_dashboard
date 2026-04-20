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

    const company = await db.company.findUnique({
      where: { id },
      include: {
        subscription: true,
        members: {
          where: { status: "ACTIVE" },
          include: { user: { select: { id: true, name: true, email: true, avatar: true, lastLoginAt: true } } },
          orderBy: { joinedAt: "asc" },
        },
        invites: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        jobs: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            employmentType: true,
            isActive: true,
            applicantCount: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    // Get latest credit balance
    const latestCredit = await db.companyCreditLedger.findFirst({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
    })

    // Compute stats
    const totalJobs = company.jobs.length
    const activeJobs = company.jobs.filter((j) => j.isActive && j.status === "PUBLISHED").length
    const totalMembers = company.members.length
    const totalPayments = company.payments.reduce((sum, p) => sum + (p.status === "COMPLETED" ? p.amount : 0), 0)

    return NextResponse.json({
      ...company,
      creditBalance: latestCredit?.balanceAfter ?? 0,
      stats: { totalJobs, activeJobs, totalMembers, totalPayments },
    })
  } catch (error) {
    console.error("[GET /api/admin/companies/[id]]", error)
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    const body = await req.json()
    const { action, ...data } = body

    // ── Company field updates (no action specified) ──
    if (!action) {
      const updated = await db.company.update({ where: { id }, data })
      return NextResponse.json(updated)
    }

    // ── Change subscription plan ──
    if (action === "changePlan") {
      const { plan } = data
      if (!plan || !["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"].includes(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
      }

      const subscription = await db.companySubscription.upsert({
        where: { companyId: id },
        create: { companyId: id, plan, status: "ACTIVE" },
        update: { plan, status: "ACTIVE" },
      })

      return NextResponse.json(subscription)
    }

    // ── Extend subscription ──
    if (action === "extendSubscription") {
      const { days } = data
      const extensionDays = typeof days === "number" ? days : 30

      const existing = await db.companySubscription.findUnique({ where: { companyId: id } })

      const baseDate = existing?.expiresAt && new Date(existing.expiresAt) > new Date()
        ? new Date(existing.expiresAt)
        : new Date()

      const newExpiry = new Date(baseDate)
      newExpiry.setDate(newExpiry.getDate() + extensionDays)

      const subscription = await db.companySubscription.upsert({
        where: { companyId: id },
        create: {
          companyId: id,
          status: "ACTIVE",
          expiresAt: newExpiry,
          plan: existing?.plan || "FREE",
        },
        update: {
          expiresAt: newExpiry,
          status: "ACTIVE",
        },
      })

      return NextResponse.json(subscription)
    }

    // ── Toggle auto-renew ──
    if (action === "toggleAutoRenew") {
      const { autoRenew } = data
      const existing = await db.companySubscription.findUnique({ where: { companyId: id } })
      if (!existing) {
        return NextResponse.json({ error: "No subscription found" }, { status: 404 })
      }

      const subscription = await db.companySubscription.update({
        where: { companyId: id },
        data: { autoRenew: typeof autoRenew === "boolean" ? autoRenew : !existing.autoRenew },
      })

      return NextResponse.json(subscription)
    }

    // ── Add credits ──
    if (action === "addCredits") {
      const { credits: amount, description } = data
      const creditAmount = typeof amount === "number" ? amount : 0
      if (creditAmount <= 0) {
        return NextResponse.json({ error: "Credits must be positive" }, { status: 400 })
      }

      const latestCredit = await db.companyCreditLedger.findFirst({
        where: { companyId: id },
        orderBy: { createdAt: "desc" },
      })

      const newBalance = (latestCredit?.balanceAfter ?? 0) + creditAmount

      const entry = await db.companyCreditLedger.create({
        data: {
          companyId: id,
          type: "ADMIN_ADDED",
          description: description || `Admin added ${creditAmount} credits`,
          credits: creditAmount,
          balanceAfter: newBalance,
        },
      })

      return NextResponse.json({ ...entry, currentBalance: newBalance })
    }

    // ── Remove member ──
    if (action === "removeMember") {
      const { memberId } = data
      if (!memberId) return NextResponse.json({ error: "Member ID required" }, { status: 400 })

      const member = await db.companyMember.findUnique({
        where: { id: memberId },
        include: { company: true },
      })

      if (!member || member.companyId !== id) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 })
      }

      if (member.role === "OWNER") {
        return NextResponse.json({ error: "Cannot remove company owner" }, { status: 400 })
      }

      await db.companyMember.delete({ where: { id: memberId } })

      return NextResponse.json({ success: true })
    }

    // ── Cancel invite ──
    if (action === "cancelInvite") {
      const { inviteId } = data
      if (!inviteId) return NextResponse.json({ error: "Invite ID required" }, { status: 400 })

      const invite = await db.companyInvite.findUnique({ where: { id: inviteId } })
      if (!invite || invite.companyId !== id) {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 })
      }

      await db.companyInvite.update({
        where: { id: inviteId },
        data: { status: "CANCELLED" },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[PATCH /api/admin/companies/[id]]", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
