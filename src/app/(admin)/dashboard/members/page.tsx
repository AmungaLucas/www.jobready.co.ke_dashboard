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
import { toast } from "sonner"

const roleColors: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  RECRUITER: "bg-blue-100 text-blue-700",
  VIEWER: "bg-slate-100 text-slate-700",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  REMOVED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-yellow-100 text-yellow-700",
}

interface Member {
  id: string
  role: string
  status: string
  joinedAt: string
  invitedBy: string | null
  company: { id: string; name: string; slug: string }
  user: { id: string; name: string; email: string; avatar: string | null }
}

export default function MembersPage() {
  const [items, setItems] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [newRole, setNewRole] = useState("")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (role && role !== "ALL") params.set("role", role)
      if (status && status !== "ALL") params.set("status", status)

      const res = await fetch(`/api/admin/members?${params}`)
      const data = await res.json()
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Failed to load members")
    } finally {
      setLoading(false)
    }
  }, [page, search, role, status])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleRemove = async (member: Member) => {
    if (!confirm(`Remove ${member.user?.name} from ${member.company?.name}?`)) return
    try {
      await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, status: "REMOVED" }),
      })
      toast.success("Member removed")
      fetchItems()
    } catch {
      toast.error("Failed to remove member")
    }
  }

  const handleRoleChange = async () => {
    if (!selectedMember || !newRole) return
    try {
      await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMember.id, role: newRole }),
      })
      toast.success("Role updated")
      setSelectedMember(null)
      setNewRole("")
      fetchItems()
    } catch {
      toast.error("Failed to update role")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Members</h1>
        <p className="text-slate-500 mt-1">Manage team memberships across all companies</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              placeholder="Search company or member..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-white"
            />
            <Select value={role} onValueChange={(v) => { setRole(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="RECRUITER">Recruiter</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="REMOVED">Removed</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(""); setRole(""); setStatus(""); setPage(1) }}>Clear</Button>
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
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="hidden lg:table-cell">Invited By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">No members found</TableCell>
                  </TableRow>
                ) : (
                  items.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center">
                            <span className="text-slate-600 font-semibold text-xs">{member.company?.name?.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium">{member.company?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{member.user?.name}</p>
                          <p className="text-xs text-slate-400">{member.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className={`text-xs ${roleColors[member.role] || ""}`}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className={`text-xs ${statusColors[member.status] || ""}`}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                        {new Date(member.joinedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-500">{member.invitedBy || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => { setSelectedMember(member); setNewRole(member.role) }}
                          >
                            Role
                          </Button>
                          {member.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemove(member)}
                            >
                              Remove
                            </Button>
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

      {/* Change Role Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Member</p>
                <p className="text-sm font-medium">{selectedMember.user?.name}</p>
                <p className="text-xs text-slate-400">{selectedMember.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Company</p>
                <p className="text-sm font-medium">{selectedMember.company?.name}</p>
              </div>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="RECRUITER">Recruiter</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRoleChange} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                Update Role
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
