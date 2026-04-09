"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Stats {
  totalJobs: number
  activeJobs: number
  totalUsers: number
  totalApplications: number
  totalOrders: number
  paidOrders: number
  totalRevenue: number
  publishedJobs: number
  draftJobs: number
  activeCompanies: number
  newsletterSubs: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    fullName: string
    totalAmount: number
    paymentStatus: string
    status: string
    createdAt: string
  }>
  recentJobs: Array<{
    id: string
    title: string
    status: string
    employmentType: string
    county: string
    createdAt: string
    company: { name: string }
  }>
  recentApplications: Array<{
    id: string
    status: string
    createdAt: string
    user: { name: string; email: string }
    job: { title: string; company: { name: string } }
  }>
  monthlyRevenue: Array<{ month: string; total: number }>
}

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-gray-100 text-gray-700",
  CLOSED: "bg-red-100 text-red-700",
  EXPIRED: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  SHORTLISTED: "bg-blue-100 text-blue-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
  HIRED: "bg-emerald-100 text-emerald-700",
  PAID: "bg-emerald-100 text-emerald-700",
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: "Total Jobs", value: stats?.totalJobs || 0, sub: `${stats?.activeJobs || 0} active`, color: "text-emerald-600" },
    { label: "Total Users", value: stats?.totalUsers || 0, sub: "registered", color: "text-blue-600" },
    { label: "Applications", value: stats?.totalApplications || 0, sub: "total", color: "text-purple-600" },
    { label: "Revenue", value: stats?.totalRevenue || 0, sub: formatKES(stats?.totalRevenue || 0), color: "text-amber-600", isCurrency: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here&apos;s what&apos;s happening on JobReady.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <p className="text-sm text-slate-500">{kpi.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                    {kpi.isCurrency ? kpi.sub : kpi.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{kpi.isCurrency ? `${stats?.paidOrders || 0} paid orders` : kpi.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Published Jobs", value: stats?.publishedJobs || 0 },
          { label: "Draft Jobs", value: stats?.draftJobs || 0 },
          { label: "Active Companies", value: stats?.activeCompanies || 0 },
          { label: "Total Orders", value: stats?.totalOrders || 0 },
          { label: "Newsletter Subs", value: stats?.newsletterSubs || 0 },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              {loading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatKES(value), "Revenue"]} />
                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No revenue data available
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentJobs.map((job) => (
                    <TableRow key={job.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell className="font-medium text-sm">{job.title}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{job.company?.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${statusColors[job.status] || ""}`}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">{job.employmentType}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead className="hidden sm:table-cell">Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentApplications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{app.user?.name}</p>
                          <p className="text-xs text-slate-400">{app.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{app.job?.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${statusColors[app.status] || ""}`}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-400">
                        {formatDate(app.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
