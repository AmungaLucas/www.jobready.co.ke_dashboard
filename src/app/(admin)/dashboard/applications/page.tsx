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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SHORTLISTED: "bg-blue-100 text-blue-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
  HIRED: "bg-emerald-100 text-emerald-700",
}

interface Application {
  id: string
  status: string
  coverLetter: string | null
  cvUrl: string | null
  employerNotes: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; email: string; avatar: string | null }
  job: { id: string; title: string; companyId: string; company: { id: string; name: string } }
}

interface CompanyOption {
  id: string
  name: string
}

export default function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetch("/api/admin/companies?limit=200")
      .then((r) => r.json())
      .then((d) => setCompanies(d.items || []))
      .catch(() => {})
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (status && status !== "ALL") params.set("status", status)
      if (companyId) params.set("companyId", companyId)

      const res = await fetch(`/api/admin/applications?${params}`)
      const data = await res.json()
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }, [page, search, status, companyId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, status: newStatus }),
      })
      toast.success(`Application ${newStatus.toLowerCase()}`)
      fetchItems()
    } catch {
      toast.error("Failed to update")
    }
  }

  const openDetail = (app: Application) => {
    setSelectedApp(app)
    setNotes(app.employerNotes || "")
  }

  const saveNotes = async () => {
    if (!selectedApp) return
    try {
      await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedApp.id, employerNotes: notes }),
      })
      toast.success("Notes saved")
      setSelectedApp(null)
      fetchItems()
    } catch {
      toast.error("Failed to save notes")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-slate-500 mt-1">Review and manage job applications</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search by applicant or job..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-white"
            />
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                <SelectItem value="INTERVIEW">Interview</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setStatus(""); setCompanyId(""); setPage(1) }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">No applications found</TableCell>
                  </TableRow>
                ) : (
                  items.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openDetail(app)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-600 font-semibold text-sm">
                              {app.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{app.user?.name}</p>
                            <p className="text-xs text-slate-400">{app.user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{app.job?.title}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-slate-500">{app.job?.company?.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${statusColors[app.status] || ""}`}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
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

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Applicant</p>
                  <p className="text-sm font-medium">{selectedApp.user?.name}</p>
                  <p className="text-xs text-slate-400">{selectedApp.user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Job</p>
                  <p className="text-sm font-medium">{selectedApp.job?.title}</p>
                  <p className="text-xs text-slate-400">{selectedApp.job?.company?.name}</p>
                </div>
              </div>

              {selectedApp.coverLetter && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Cover Letter</p>
                  <div className="bg-slate-50 p-3 rounded text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedApp.coverLetter}
                  </div>
                </div>
              )}

              {selectedApp.cvUrl && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">CV</p>
                  <a
                    href={selectedApp.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    View CV
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["PENDING", "SHORTLISTED", "INTERVIEW", "REJECTED", "HIRED"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedApp.status === s ? "default" : "outline"}
                      className={selectedApp.status === s ? "bg-emerald-600 text-white" : ""}
                      onClick={() => {
                        updateStatus(selectedApp.id, s)
                        setSelectedApp({ ...selectedApp, status: s })
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Employer Notes</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={3}
                />
              </div>

              <Button onClick={saveNotes} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Save Notes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
