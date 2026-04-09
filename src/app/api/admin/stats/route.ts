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

    const [
      totalJobs,
      activeJobs,
      totalUsers,
      totalApplications,
      totalOrders,
      paidOrders,
      totalRevenue,
      recentOrders,
      publishedJobs,
      draftJobs,
      activeCompanies,
      newsletterSubs,
      recentJobs,
      recentApplications,
    ] = await Promise.all([
      db.job.count(),
      db.job.count({ where: { isActive: true, status: "PUBLISHED" } }),
      db.user.count(),
      db.application.count(),
      db.order.count(),
      db.order.count({ where: { paymentStatus: "PAID" } }),
      db.order.aggregate({ _sum: { paidAmount: true }, where: { paymentStatus: "PAID" } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          fullName: true,
          totalAmount: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
        },
      }),
      db.job.count({ where: { status: "PUBLISHED" } }),
      db.job.count({ where: { status: "DRAFT" } }),
      db.company.count({ where: { isActive: true } }),
      db.newsletterSubscription.count({ where: { isActive: true } }),
      db.job.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { company: { select: { name: true } } },
      }),
      db.application.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          job: { select: { title: true, company: { select: { name: true } } } },
        },
      }),
    ])

    // Monthly revenue data for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await db.$queryRaw<Array<{ month: string; total: bigint }>>`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, SUM(paidAmount) as total
      FROM orders
      WHERE paymentStatus = 'PAID' AND createdAt >= ${sixMonthsAgo}
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `

    return NextResponse.json({
      totalJobs,
      activeJobs,
      totalUsers,
      totalApplications,
      totalOrders,
      paidOrders,
      totalRevenue: totalRevenue._sum.paidAmount || 0,
      publishedJobs,
      draftJobs,
      activeCompanies,
      newsletterSubs,
      recentOrders,
      recentJobs,
      recentApplications,
      monthlyRevenue: monthlyRevenue.map((r) => ({
        month: r.month,
        total: Number(r.total),
      })),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
