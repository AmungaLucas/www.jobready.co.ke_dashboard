"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

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
}

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/companies?${params}`)
      const data = await res.json()
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
        <p className="text-slate-500 mt-1">Manage organizations and employers on the platform</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-white max-w-sm"
            />
            <Button variant="outline" onClick={() => { setSearch(""); setPage(1) }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Industry</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">County</TableHead>
                  <TableHead className="hidden sm:table-cell">Jobs</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400">No companies found</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                            <span className="text-slate-600 font-semibold text-xs">
                              {item.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-slate-400 lg:hidden">{item.industry}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{item.industry}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">
                        {item.organizationType?.replace(/_/g, " ") || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-500">{item.county || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{item.jobCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleField(item.id, "isVerified", item.isVerified)}
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
                          onClick={() => toggleField(item.id, "isFeatured", item.isFeatured)}
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
