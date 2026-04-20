"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Building2,
  CheckCircle,
  ShieldCheck,
  Briefcase,
  X,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import { exportToCSV } from "@/lib/export-utils"

const planColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-600",
  STARTER: "bg-slate-100 text-slate-700",
  PROFESSIONAL: "bg-emerald-100 text-emerald-700",
  ENTERPRISE: "bg-purple-100 text-purple-700",
}

interface Company {
  id: string
  name: string
  slug: string
  industry: string
  organizationType: string | null
  county: string | null
  isVerified: boolean
  isFeatured: boolean
  isActive: boolean
  jobCount: number
  createdAt: string
  owner: string | null
  teamSize: number
  plan: string
}

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [plan, setPlan] = useState("all")
  const [status, setStatus] = useState("all")
  const [verified, setVerified] = useState("all")
  const [featured, setFeatured] = useState("all")
  const [sort, setSort] = useState("newest")
  const [summary, setSummary] = useState<{ total: number; active: number; verified: number } | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (plan && plan !== "all") params.set("plan", plan)
      if (status && status !== "all") params.set("status", status)
      if (verified && verified !== "all") params.set("verified", verified)
      if (featured && featured !== "all") params.set("featured", featured)
      if (sort) params.set("sort", sort)

      const res = await fetch(`/api/admin/companies?${params}`)
      const data = await res.json()
      setItems(data.items)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      if (data.summary) setSummary(data.summary)
    } catch {
      toast.error("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }, [page, search, plan, status, verified, featured, sort])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const clearFilters = () => {
    setSearch("")
    setPlan("all")
    setStatus("all")
    setVerified("all")
    setFeatured("all")
    setSort("newest")
    setPage(1)
  }

  const toggleField = async (id: string, field: "isVerified" | "isFeatured", current: boolean) => {
    try {
      await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: !current }),
      })
      toast.success(`${field === "isVerified" ? "Verification" : "Featured"} status updated`)
      fetchItems()
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleExportAll = async () => {
    try {
      const params = new URLSearchParams({ page: "1", limit: "500" })
      if (search) params.set("search", search)
      if (plan && plan !== "all") params.set("plan", plan)
      if (status && status !== "all") params.set("status", status)
      if (verified && verified !== "all") params.set("verified", verified)
      if (featured && featured !== "all") params.set("featured", featured)

      const res = await fetch(`/api/admin/companies?${params}`)
      const data = await res.json()

      if (!data.items || data.items.length === 0) {
        toast.error("No companies to export")
        return
      }

      const csvData = data.items.map((item: Company) => ({
        Name: item.name,
        Industry: item.industry,
        "Organization Type": item.organizationType || "",
        Owner: item.owner || "",
        "Team Size": item.teamSize,
        Plan: item.plan,
        Jobs: item.jobCount,
        Verified: item.isVerified ? "Yes" : "No",
        Featured: item.isFeatured ? "Yes" : "No",
        Active: item.isActive ? "Yes" : "No",
        County: item.county || "",
        Created: new Date(item.createdAt).toLocaleDateString("en-KE"),
      }))

      const date = new Date().toISOString().split("T")[0]
      exportToCSV(csvData, `companies-${date}`)
      toast.success(`Exported ${data.items.length} companies`)
    } catch {
      toast.error("Failed to export companies")
    }
  }

  const hasActiveFilters = (status !== "all") || (plan !== "all") || (verified !== "all") || (featured !== "all") || search

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500 mt-1">Manage organizations and employers on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => (window.location.href = "/dashboard/companies/new")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Company
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{summary?.total ?? "—"}</p>
                <p className="text-xs text-slate-500">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{summary?.active ?? "—"}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{summary?.verified ?? "—"}</p>
                <p className="text-xs text-slate-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Briefcase className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{total}</p>
                <p className="text-xs text-slate-500">Showing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Search + Sort row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="bg-white pl-9"
                />
              </div>
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-[160px] bg-white text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name_asc">Name A→Z</SelectItem>
                  <SelectItem value="name_desc">Name Z→A</SelectItem>
                  <SelectItem value="jobs_desc">Most Jobs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter pills row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-1">Filters:</span>

              {/* Status filter */}
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
                <SelectTrigger className="h-7 w-[120px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Plan filter */}
              <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1) }}>
                <SelectTrigger className="h-7 w-[130px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              {/* Verified filter */}
              <Select value={verified} onValueChange={(v) => { setVerified(v); setPage(1) }}>
                <SelectTrigger className="h-7 w-[120px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Verified</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>

              {/* Featured filter */}
              <Select value={featured} onValueChange={(v) => { setFeatured(v); setPage(1) }}>
                <SelectTrigger className="h-7 w-[120px] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Featured</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>

              {/* Active filters count + clear */}
              {hasActiveFilters && (
                <>
                  <span className="text-xs text-slate-400">
                    ({total} results)
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={clearFilters}>
                    <X className="size-3 mr-1" />
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Owner</TableHead>
                  <TableHead className="hidden md:table-cell">Industry</TableHead>
                  <TableHead className="hidden lg:table-cell">Team</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead className="hidden sm:table-cell">Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-slate-400">No companies found</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => (window.location.href = `/dashboard/companies/${item.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                            <span className="text-slate-600 font-semibold text-xs">
                              {item.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-slate-400 md:hidden">{item.industry} · {item.plan}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{item.owner || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">{item.industry}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="text-xs">{item.teamSize}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className={`text-xs ${planColors[item.plan] || ""}`}>
                          {item.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{item.jobCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleField(item.id, "isVerified", item.isVerified) }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.isVerified
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isVerified ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {item.isVerified ? "Yes" : "No"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleField(item.id, "isFeatured", item.isFeatured) }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.isFeatured
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isFeatured ? "bg-amber-500" : "bg-gray-400"}`} />
                          {item.isFeatured ? "Yes" : "No"}
                        </button>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
