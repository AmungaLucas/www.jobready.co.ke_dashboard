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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-gray-100 text-gray-700",
  CLOSED: "bg-red-100 text-red-700",
  EXPIRED: "bg-yellow-100 text-yellow-700",
}

function getDeadlineColor(deadline: string | null): string {
  if (!deadline) return ""
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return "text-red-600 font-medium"
  if (days <= 7) return "text-red-600"
  if (days <= 30) return "text-amber-600"
  return "text-slate-600"
}

interface Opportunity {
  id: string
  title: string
  slug: string
  opportunityType: string
  deadline: string | null
  status: string
  viewCount: number
  createdAt: string
  company: { name: string } | null
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [type, setType] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (status) params.set("status", status)
      if (type) params.set("type", type)

      const res = await fetch(`/api/admin/opportunities?${params}`)
      const data = await res.json()
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Failed to load opportunities")
    } finally {
      setLoading(false)
    }
  }, [page, search, status, type])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const deleteOpportunity = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/admin/opportunities?id=${deleteId}`, { method: "DELETE" })
      toast.success("Opportunity deleted")
      setDeleteId(null)
      fetchItems()
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
        <p className="text-slate-500 mt-1">Manage scholarships, fellowships, internships, and more</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search opportunities..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-white"
            />
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                <SelectItem value="INTERNSHIP">Internship</SelectItem>
                <SelectItem value="BURSARY">Bursary</SelectItem>
                <SelectItem value="GRANT">Grant</SelectItem>
                <SelectItem value="TRAINING">Training</SelectItem>
                <SelectItem value="COMPETITION">Competition</SelectItem>
                <SelectItem value="MENTORSHIP">Mentorship</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setStatus(""); setType(""); setPage(1) }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden lg:table-cell">Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Views</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-12"></TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                      No opportunities found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-sm">{item.title}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs bg-slate-100">{item.opportunityType?.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">{item.company?.name || "—"}</TableCell>
                      <TableCell className={`hidden lg:table-cell text-sm ${getDeadlineColor(item.deadline)}`}>
                        {item.deadline ? new Date(item.deadline).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${statusColors[item.status] || ""}`}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">{item.viewCount}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              fetch("/api/admin/opportunities", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: item.id, status: item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
                              }).then(() => fetchItems())
                            }}>
                              {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              window.open(`${process.env.NEXT_PUBLIC_SITE_URL}/opportunities/${item.slug}`, "_blank")
                            }}>
                              View on site
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(item.id)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Opportunity</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteOpportunity}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
