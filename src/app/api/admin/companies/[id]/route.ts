import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"

async function verifyAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== "ADMIN") return null
  return token
}

// ── Activity log helper ──

async function logActivity(params: {
  companyId: string
  adminId?: string | null
  adminName?: string | null
  adminEmail?: string | null
  action: string
  details: string
  metadata?: Prisma.InputJsonValue
}) {
  try {
    await db.companyActivityLog.create({
      data: {
        companyId: params.companyId,
        adminId: params.adminId ?? null,
        adminName: params.adminName ?? null,
        adminEmail: params.adminEmail ?? null,
        action: params.action,
        details: params.details,
        metadata: params.metadata ?? undefined,
      },
    })
  } catch (err) {
    // Log activity should never cause the main operation to fail
    console.error("[logActivity] Failed to log activity:", err)
  }
}

function getAdminInfo(admin: Awaited<ReturnType<typeof verifyAdmin>>) {
  return {
    adminId: (admin?.sub as string) ?? null,
    adminName: (admin?.name as string) ?? null,
    adminEmail: (admin?.email as string) ?? null,
  }
}

// ── Trackable company fields for UPDATE_COMPANY logging ──

const TRACKABLE_FIELDS = [
  "name", "industry", "description", "organizationType", "size",
  "website", "contactEmail", "phoneNumber", "county", "town", "country",
  "isVerified", "isFeatured", "isActive", "noIndex",
  "metaTitle", "metaDescription", "ogImage", "logo", "logoColor",
] as const

function diffCompanyFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const changed: string[] = []
  for (const field of TRACKABLE_FIELDS) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      changed.push(field)
    }
  }
  return changed
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

    const { searchParams } = new URL(req.url)
    const includeBoosts = searchParams.get("includeBoosts") === "true"
    const includeActivity = searchParams.get("includeActivity") === "true"

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
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            mpesaReceiptNumber: true,
            phoneNumber: true,
            description: true,
            createdAt: true,
          },
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

    // Compute boost stats from payments
    let boostStats = { totalBoosts: 0, totalBoostRevenue: 0, activeBoosts: 0 }
    if (includeBoosts) {
      const boostPayments = await db.payment.findMany({
        where: { companyId: id, type: "BOOST", status: "COMPLETED" },
      })
      boostStats = {
        totalBoosts: boostPayments.length,
        totalBoostRevenue: boostPayments.reduce((sum, p) => sum + p.amount, 0),
        activeBoosts: boostPayments.filter((p) => {
          // Consider boost active if created within last 30 days (simplified heuristic)
          return (Date.now() - new Date(p.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
        }).length,
      }
    }

    // Fetch activity logs if requested
    let activityLogs: Array<{
      id: string
      action: string
      details: string | null
      adminName: string | null
      adminEmail: string | null
      createdAt: Date
    }> = []
    if (includeActivity) {
      activityLogs = await db.companyActivityLog.findMany({
        where: { companyId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    }

    return NextResponse.json({
      ...company,
      creditBalance: latestCredit?.balanceAfter ?? 0,
      stats: { totalJobs, activeJobs, totalMembers, totalPayments },
      ...(includeBoosts ? { boostStats } : {}),
      ...(includeActivity ? { activityLogs } : {}),
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
    const adminInfo = getAdminInfo(admin)

    // ── Company field updates (no action specified) ──
    if (!action) {
      // Fetch before state for diff
      const before = await db.company.findUnique({ where: { id } })
      if (!before) return NextResponse.json({ error: "Company not found" }, { status: 404 })

      const updated = await db.company.update({ where: { id }, data })

      // Log field changes
      const changedFields = diffCompanyFields(
        before as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
      )
      if (changedFields.length > 0) {
        await logActivity({
          ...adminInfo,
          companyId: id,
          action: "UPDATE_COMPANY",
          details: `Updated: ${changedFields.join(", ")}`,
          metadata: { changedFields, before: before as unknown as Record<string, unknown>, after: updated as unknown as Record<string, unknown> },
        })
      }

      return NextResponse.json(updated)
    }

    // ── Change subscription plan ──
    if (action === "changePlan") {
      const { plan } = data
      if (!plan || !["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"].includes(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
      }

      // Get previous plan for details
      const previousSub = await db.companySubscription.findUnique({ where: { companyId: id } })
      const previousPlan = previousSub?.plan || "FREE"

      const subscription = await db.companySubscription.upsert({
        where: { companyId: id },
        create: { companyId: id, plan, status: "ACTIVE" },
        update: { plan, status: "ACTIVE" },
      })

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "CHANGE_PLAN",
        details: `Changed plan from ${previousPlan} to ${plan}`,
        metadata: { previousPlan, newPlan: plan },
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

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "EXTEND_SUBSCRIPTION",
        details: `Extended subscription by ${extensionDays} days`,
        metadata: { days: extensionDays, newExpiry: newExpiry.toISOString() },
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

      const newAutoRenew = typeof autoRenew === "boolean" ? autoRenew : !existing.autoRenew

      const subscription = await db.companySubscription.update({
        where: { companyId: id },
        data: { autoRenew: newAutoRenew },
      })

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "TOGGLE_AUTO_RENEW",
        details: newAutoRenew ? "Auto-renew enabled" : "Auto-renew disabled",
        metadata: { previousAutoRenew: existing.autoRenew, newAutoRenew },
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

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "ADD_CREDITS",
        details: `Added ${creditAmount} credits`,
        metadata: { credits: creditAmount, newBalance, description },
      })

      return NextResponse.json({ ...entry, currentBalance: newBalance })
    }

    // ── Suspend company ──
    if (action === "suspendCompany") {
      const { reason } = data
      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return NextResponse.json({ error: "Suspension reason is required" }, { status: 400 })
      }

      const company = await db.company.findUnique({ where: { id } })
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 })
      }

      const existingMeta = (company.aiMeta as Record<string, unknown>) || {}
      const suspensionData = {
        reason: reason.trim(),
        suspendedAt: new Date().toISOString(),
        suspendedBy: (admin.name as string) || (admin.email as string) || "admin",
      }

      const updated = await db.company.update({
        where: { id },
        data: {
          isActive: false,
          aiMeta: { ...existingMeta, suspension: suspensionData },
        },
      })

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "SUSPEND",
        details: reason.trim(),
        metadata: { reason: reason.trim(), suspendedBy: suspensionData.suspendedBy },
      })

      return NextResponse.json(updated)
    }

    // ── Reactivate company ──
    if (action === "reactivateCompany") {
      const company = await db.company.findUnique({ where: { id } })
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 })
      }

      const existingMeta = (company.aiMeta as Record<string, unknown>) || {}
      const { suspension, ...restMeta } = existingMeta
      const reactivationData = {
        reactivatedAt: new Date().toISOString(),
        reactivatedBy: (admin.name as string) || (admin.email as string) || "admin",
        previousSuspension: suspension,
      }

      const updated = await db.company.update({
        where: { id },
        data: {
          isActive: true,
          aiMeta: JSON.parse(JSON.stringify({ ...restMeta, reactivation: reactivationData })),
        },
      })

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "REACTIVATE",
        details: "Company reactivated",
        metadata: { reactivatedBy: reactivationData.reactivatedBy },
      })

      return NextResponse.json(updated)
    }

    // ── Remove member ──
    if (action === "removeMember") {
      const { memberId } = data
      if (!memberId) return NextResponse.json({ error: "Member ID required" }, { status: 400 })

      const member = await db.companyMember.findUnique({
        where: { id: memberId },
        include: { company: true, user: { select: { name: true, email: true } } },
      })

      if (!member || member.companyId !== id) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 })
      }

      if (member.role === "OWNER") {
        return NextResponse.json({ error: "Cannot remove company owner" }, { status: 400 })
      }

      await db.companyMember.delete({ where: { id: memberId } })

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "REMOVE_MEMBER",
        details: `Removed member ${member.user.name} (${member.user.email})`,
        metadata: { memberId, memberName: member.user.name, memberEmail: member.user.email, memberRole: member.role },
      })

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

      await logActivity({
        ...adminInfo,
        companyId: id,
        action: "CANCEL_INVITE",
        details: `Cancelled invite to ${invite.email}`,
        metadata: { inviteId, email: invite.email, role: invite.role },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[PATCH /api/admin/companies/[id]]", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
