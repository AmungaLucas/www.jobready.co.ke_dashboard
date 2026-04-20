"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-700",
  EXPIRED: "bg-gray-100 text-gray-500",
}

const roleColors: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  RECRUITER: "bg-blue-100 text-blue-700",
  VIEWER: "bg-slate-100 text-slate-700",
}

interface Invite {
  id: string
  email: string
  role: string
  status: string
  invitedBy: string | null
  expiresAt: string
  createdAt: string
  company: { id: string; name: string; slug: string }
}

export default function InvitesPage() {
  const [items, setItems] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState("")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (status && status !== "ALL") params.set("status", status)

      const res = await fetch(`/api/admin/invites?${params}`)
      const data = await res.json()
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Failed to load invites")
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleCancel = async (invite: Invite) => {
    if (!confirm(`Cancel invitation to ${invite.email}?`)) return
    try {
      await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invite.id, status: "CANCELLED" }),
      })
      toast.success("Invitation cancelled")
      fetchItems()
    } catch {
      toast.error("Failed to cancel invitation")
    }
  }

  const handleResend = async (invite: Invite) => {
    try {
      await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invite.id, status: "PENDING" }),
      })
      toast.success("Invitation resent")
      fetchItems()
    } catch {
      toast.error("Failed to resend invitation")
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Invites</h1>
        <p className="text-slate-500 mt-1">Manage pending and expired team invitations</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="max-w-xs bg-white"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setStatus(""); setPage(1) }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Invited By</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="hidden lg:table-cell">Expires</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400">No invitations found</TableCell>
                  </TableRow>
                ) : (
                  items.map((invite) => (
                    <TableRow key={invite.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center">
                            <span className="text-slate-600 font-semibold text-xs">{invite.company?.name?.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium">{invite.company?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{invite.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className={`text-xs ${roleColors[invite.role] || ""}`}>
                          {invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${statusColors[invite.status] || ""}`}>
                          {invite.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-500">{invite.invitedBy || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                        {new Date(invite.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                        <span className={isExpired(invite.expiresAt) ? "text-red-500" : ""}>
                          {new Date(invite.expiresAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(invite.status === "PENDING" || invite.status === "EXPIRED") && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancel(invite)}
                              >
                                Cancel
                              </Button>
                              {invite.status === "EXPIRED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => handleResend(invite)}
                                >
                                  Resend
                                </Button>
                              )}
                            </>
                          )}
                        </div>
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
