"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { FileImportButton } from "@/components/file-import-button"
import { organizationType, organizationIndustry, organizationSize, organizationLocation } from "@/constants/enums"
import {
  Building2,
  Globe,
  Palette,
  Settings2,
  Search,
  ArrowLeft,
  Users,
  CreditCard,
  Briefcase,
  Pencil,
  ExternalLink,
  Crown,
  Clock,
  ShieldCheck,
  Star,
  Zap,
  CalendarClock,
  TrendingUp,
  UserPlus,
  Trash2,
  X,
  RotateCcw,
  Receipt,
  AlertTriangle,
  History,
  StickyNote,
  Pin,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompanyData {
  id: string
  name: string
  slug: string
  logo: string | null
  logoColor: string | null
  description: string
  industry: string
  organizationType: string | null
  size: string | null
  county: string | null
  town: string | null
  country: string
  website: string | null
  contactEmail: string | null
  phoneNumber: string | null
  socialLinks: Record<string, string> | null
  isVerified: boolean
  isFeatured: boolean
  isActive: boolean
  noIndex: boolean
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  createdAt: string
  updatedAt: string
  creditBalance: number
  stats: {
    totalJobs: number
    activeJobs: number
    totalMembers: number
    totalPayments: number
  }
  subscription: {
    id: string
    plan: string
    status: string
    startedAt: string
    expiresAt: string | null
    autoRenew: boolean
    features: unknown
  } | null
  members: {
    id: string
    role: string
    status: string
    joinedAt: string
    lastActiveAt: string | null
    user: {
      id: string
      name: string
      email: string
      avatar: string | null
      lastLoginAt: string | null
    }
  }[]
  invites: {
    id: string
    email: string
    role: string
    token: string
    status: string
    expiresAt: string
    createdAt: string
  }[]
  aiMeta: Record<string, unknown> | null
  payments: {
    id: string
    type: string
    amount: number
    status: string
    mpesaReceiptNumber: string | null
    phoneNumber: string | null
    description: string | null
    createdAt: string
  }[]
  jobs: {
    id: string
    title: string
    slug: string
    status: string
    employmentType: string
    isActive: boolean
    applicantCount: number
    publishedAt: string | null
    createdAt: string
  }[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const planColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-700",
  STARTER: "bg-slate-100 text-slate-700",
  PROFESSIONAL: "bg-emerald-100 text-emerald-700",
  ENTERPRISE: "bg-purple-100 text-purple-700",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-amber-100 text-amber-700",
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  CLOSED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
}

const paymentStatusColors: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
}

const paymentTypeColors: Record<string, string> = {
  SUBSCRIPTION: "bg-blue-100 text-blue-700",
  BOOST: "bg-amber-100 text-amber-700",
  ORDER: "bg-slate-100 text-slate-700",
}

const creditTypeColors: Record<string, string> = {
  ADMIN_ADDED: "bg-emerald-100 text-emerald-700",
  SUBSCRIPTION: "bg-blue-100 text-blue-700",
  BOOST: "bg-amber-100 text-amber-700",
  REFUND: "bg-red-100 text-red-700",
  WELCOME_BONUS: "bg-violet-100 text-violet-700",
}

const roleColors: Record<string, string> = {
  OWNER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
  RECRUITER: "bg-gray-100 text-gray-600 border-gray-200",
}

const activityActionColors: Record<string, string> = {
  CHANGE_PLAN: "bg-blue-100 text-blue-700",
  EXTEND_SUBSCRIPTION: "bg-blue-100 text-blue-700",
  TOGGLE_AUTO_RENEW: "bg-blue-100 text-blue-700",
  ADD_CREDITS: "bg-emerald-100 text-emerald-700",
  SUSPEND: "bg-red-100 text-red-700",
  REACTIVATE: "bg-emerald-100 text-emerald-700",
  REMOVE_MEMBER: "bg-amber-100 text-amber-700",
  CANCEL_INVITE: "bg-amber-100 text-amber-700",
  UPDATE_COMPANY: "bg-slate-100 text-slate-700",
}

const plans = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as const

function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatDateTime(date: string | null): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Edit form state
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    industry: "",
    description: "",
    organizationType: "",
    size: "",
    website: "",
    contactEmail: "",
    phoneNumber: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    logo: "",
    logoColor: "",
    country: "Kenya",
    county: "",
    town: "",
    isVerified: false,
    isFeatured: false,
    isActive: true,
    noIndex: false,
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
  })

  // Dialog states
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [extendSubOpen, setExtendSubOpen] = useState(false)
  const [addCreditsOpen, setAddCreditsOpen] = useState(false)
  const [extendDays, setExtendDays] = useState("30")
  const [creditAmount, setCreditAmount] = useState("")
  const [creditDescription, setCreditDescription] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Remove member dialog
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)

  // Suspension state
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState("")
  const [suspensionLoading, setSuspensionLoading] = useState(false)

  // Payment filters
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("ALL")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL")

  // Credits state
  const [creditLedger, setCreditLedger] = useState<{
    id: string; type: string; description: string; credits: number; balanceAfter: number; createdAt: string
  }[]>([])
  const [creditSummary, setCreditSummary] = useState({ totalAdded: 0, totalDeducted: 0, currentBalance: 0 })
  const [creditLoading, setCreditLoading] = useState(false)

  // Boost state
  const [boostStats, setBoostStats] = useState<{ totalBoosts: number; totalBoostRevenue: number; activeBoosts: number } | null>(null)
  const [boostedOnly, setBoostedOnly] = useState(false)

  // Activity log state
  const [activityLogs, setActivityLogs] = useState<{
    id: string; action: string; details: string | null; adminName: string | null; adminEmail: string | null; createdAt: string
  }[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Notes state
  const [companyNotes, setCompanyNotes] = useState<{
    id: string; content: string; isPinned: boolean; authorName: string | null; authorEmail: string | null; createdAt: string; updatedAt: string
  }[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newNotePinned, setNewNotePinned] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/companies/${id}`)
      if (!res.ok) {
        toast.error("Company not found")
        router.push("/dashboard/companies")
        return
      }
      const data: CompanyData = await res.json()
      setCompany(data)

      // Populate edit form
      const socialLinks = data.socialLinks || {}
      setForm({
        name: data.name || "",
        industry: data.industry || "",
        description: data.description || "",
        organizationType: data.organizationType || "",
        size: data.size || "",
        website: data.website || "",
        contactEmail: data.contactEmail || "",
        phoneNumber: data.phoneNumber || "",
        facebook: socialLinks.facebook || "",
        twitter: socialLinks.twitter || "",
        linkedin: socialLinks.linkedin || "",
        instagram: socialLinks.instagram || "",
        logo: data.logo || "",
        logoColor: data.logoColor || "",
        country: data.country || "Kenya",
        county: data.county || "",
        town: data.town || "",
        isVerified: data.isVerified || false,
        isFeatured: data.isFeatured || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
        noIndex: data.noIndex || false,
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        ogImage: data.ogImage || "",
      })
    } catch {
      toast.error("Failed to load company")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  // ── Admin actions ──

  const handleChangePlan = async () => {
    if (!selectedPlan) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePlan", plan: selectedPlan }),
      })
      if (res.ok) {
        toast.success(`Plan changed to ${selectedPlan}`)
        setChangePlanOpen(false)
        setSelectedPlan("")
        fetchCompany()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to change plan")
      }
    } catch {
      toast.error("Failed to change plan")
    } finally {
      setActionLoading(false)
    }
  }

  const handleExtendSubscription = async () => {
    const days = parseInt(extendDays) || 30
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extendSubscription", days }),
      })
      if (res.ok) {
        toast.success(`Subscription extended by ${days} days`)
        setExtendSubOpen(false)
        setExtendDays("30")
        fetchCompany()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to extend subscription")
      }
    } catch {
      toast.error("Failed to extend subscription")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleAutoRenew = async () => {
    if (!company?.subscription) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleAutoRenew" }),
      })
      if (res.ok) {
        toast.success("Auto-renew toggled")
        fetchCompany()
      } else {
        toast.error("Failed to toggle auto-renew")
      }
    } catch {
      toast.error("Failed to toggle auto-renew")
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddCredits = async () => {
    const credits = parseInt(creditAmount) || 0
    if (credits <= 0) {
      toast.error("Enter a valid credit amount")
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addCredits",
          credits,
          description: creditDescription || undefined,
        }),
      })
      if (res.ok) {
        toast.success(`${credits} credits added`)
        setAddCreditsOpen(false)
        setCreditAmount("")
        setCreditDescription("")
        fetchCompany()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to add credits")
      }
    } catch {
      toast.error("Failed to add credits")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeMember", memberId: memberToRemove.id }),
      })
      if (res.ok) {
        toast.success("Member removed")
        setRemoveMemberOpen(false)
        setMemberToRemove(null)
        fetchCompany()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to remove member")
      }
    } catch {
      toast.error("Failed to remove member")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancelInvite", inviteId }),
      })
      if (res.ok) {
        toast.success("Invitation cancelled")
        fetchCompany()
      } else {
        toast.error("Failed to cancel invitation")
      }
    } catch {
      toast.error("Failed to cancel invitation")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendCompany = async () => {
    if (!suspendReason.trim()) {
      toast.error("Please provide a suspension reason")
      return
    }
    setSuspensionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspendCompany", reason: suspendReason.trim() }),
      })
      if (res.ok) {
        toast.success("Company suspended")
        setSuspendDialogOpen(false)
        setSuspendReason("")
        fetchCompany()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to suspend company")
      }
    } catch {
      toast.error("Failed to suspend company")
    } finally {
      setSuspensionLoading(false)
    }
  }

  const handleReactivateCompany = async () => {
    setSuspensionLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivateCompany" }),
      })
      if (res.ok) {
        toast.success("Company reactivated")
        fetchCompany()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to reactivate company")
      }
    } catch {
      toast.error("Failed to reactivate company")
    } finally {
      setSuspensionLoading(false)
    }
  }

  const fetchActivityLogs = useCallback(async () => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}?includeActivity=true`)
      if (res.ok) {
        const data = await res.json()
        if (data.activityLogs) setActivityLogs(data.activityLogs)
      }
    } catch {
      // Silent fail
    } finally {
      setActivityLoading(false)
    }
  }, [id])

  const fetchCredits = useCallback(async () => {
    setCreditLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}/credits?limit=100`)
      if (res.ok) {
        const data = await res.json()
        setCreditLedger(data.entries)
        setCreditSummary(data.summary)
      }
    } catch {
      toast.error("Failed to load credit ledger")
    } finally {
      setCreditLoading(false)
    }
  }, [id])

  const fetchBoostStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/companies/${id}?includeBoosts=true`)
      if (res.ok) {
        const data = await res.json()
        if (data.boostStats) setBoostStats(data.boostStats)
      }
    } catch {
      // Silently fail for boost stats
    }
  }, [id])

  // ── Notes handlers ──

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}/notes`)
      if (res.ok) {
        const data = await res.json()
        setCompanyNotes(data)
      }
    } catch {
      toast.error("Failed to load notes")
    } finally {
      setNotesLoading(false)
    }
  }, [id])

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return
    setNoteSaving(true)
    try {
      const res = await fetch(`/api/admin/companies/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent.trim(), isPinned: newNotePinned }),
      })
      if (res.ok) {
        toast.success("Note added")
        setNewNoteContent("")
        setNewNotePinned(false)
        fetchNotes()
      } else {
        toast.error("Failed to add note")
      }
    } catch {
      toast.error("Failed to add note")
    } finally {
      setNoteSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return
    setDeletingNoteId(noteId)
    try {
      const res = await fetch(`/api/admin/companies/${id}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      })
      if (res.ok) {
        toast.success("Note deleted")
        fetchNotes()
      } else {
        toast.error("Failed to delete note")
      }
    } catch {
      toast.error("Failed to delete note")
    } finally {
      setDeletingNoteId(null)
    }
  }

  useEffect(() => {
    if (activeTab === "activity" && activityLogs.length === 0) {
      fetchActivityLogs()
    }
  }, [activeTab, activityLogs.length, fetchActivityLogs])

  useEffect(() => {
    if (activeTab === "credits" && creditLedger.length === 0) {
      fetchCredits()
    }
  }, [activeTab, creditLedger.length, fetchCredits])

  useEffect(() => {
    if (activeTab === "jobs" && !boostStats) {
      fetchBoostStats()
    }
  }, [activeTab, boostStats, fetchBoostStats])

  useEffect(() => {
    if (activeTab === "notes" && companyNotes.length === 0) {
      fetchNotes()
    }
  }, [activeTab, companyNotes.length, fetchNotes])

  // ── Edit form handler ──

  const handleSave = async () => {
    if (!form.name.trim() || !form.industry.trim() || !form.description.trim()) {
      toast.error("Name, industry, and description are required")
      return
    }
    setSaving(true)
    try {
      const socialLinks: Record<string, string> = {}
      if (form.facebook) socialLinks.facebook = form.facebook
      if (form.twitter) socialLinks.twitter = form.twitter
      if (form.linkedin) socialLinks.linkedin = form.linkedin
      if (form.instagram) socialLinks.instagram = form.instagram

      const payload = {
        name: form.name,
        industry: form.industry,
        description: form.description,
        organizationType: form.organizationType || null,
        size: form.size || null,
        website: form.website || null,
        contactEmail: form.contactEmail || null,
        phoneNumber: form.phoneNumber || null,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        logo: form.logo || null,
        logoColor: form.logoColor || null,
        country: form.country || "Kenya",
        county: form.county || null,
        town: form.town || null,
        isVerified: form.isVerified,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        noIndex: form.noIndex,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        ogImage: form.ogImage || null,
      }

      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      })

      if (res.ok) {
        toast.success("Company updated successfully")
        fetchCompany()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update company")
      }
    } catch {
      toast.error("Failed to update company")
    } finally {
      setSaving(false)
    }
  }

  // ── Loading skeleton ──

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!company) return null

  const sub = company.subscription
  const suspensionInfo = (company.aiMeta?.suspension as { reason: string; suspendedAt: string; suspendedBy: string } | undefined)

  // Computed payment stats
  const filteredPayments = company.payments.filter((p) => {
    if (paymentTypeFilter !== "ALL" && p.type !== paymentTypeFilter) return false
    if (paymentStatusFilter !== "ALL" && p.status !== paymentStatusFilter) return false
    return true
  })
  const totalRevenue = company.payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0)
  const pendingAmount = company.payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0)
  const failedAmount = company.payments.filter((p) => p.status === "FAILED").reduce((s, p) => s + p.amount, 0)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/companies")}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 mb-4"
      >
        <ArrowLeft className="size-3.5" />
        Back to Companies
      </button>

      {/* Company header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{ backgroundColor: company.logoColor ? `${company.logoColor}18` : "#f1f5f9", color: company.logoColor || "#64748b" }}>
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              company.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{company.name}</h1>
              {company.isVerified && (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0">
                  <ShieldCheck className="size-3 mr-0.5" /> Verified
                </Badge>
              )}
              {company.isFeatured && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0">
                  <Star className="size-3 mr-0.5" /> Featured
                </Badge>
              )}
              {company.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0">Active</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5 py-0">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              {company.industry}
              {company.county ? ` · ${company.county}${company.town ? `, ${company.town}` : ""}` : ""}
              {company.country !== "Kenya" ? ` · ${company.country}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("edit")}
          >
            <Pencil className="size-3.5 mr-1.5" />
            Edit
          </Button>
          {company.website && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(company.website!, "_blank")}
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              Website
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Building2 className="size-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5">
            <CreditCard className="size-3.5" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <Receipt className="size-3.5" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-1.5">
            <Zap className="size-3.5" />
            <span className="hidden sm:inline">Credits</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <History className="size-3.5" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <StickyNote className="size-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="size-3.5" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1.5">
            <Briefcase className="size-3.5" />
            <span className="hidden sm:inline">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-1.5">
            <Pencil className="size-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Briefcase className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{company.stats.totalJobs}</p>
                      <p className="text-xs text-slate-500">Total Jobs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <TrendingUp className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{company.stats.activeJobs}</p>
                      <p className="text-xs text-slate-500">Active Jobs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{company.stats.totalMembers}</p>
                      <p className="text-xs text-slate-500">Team Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <CreditCard className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatKES(company.stats.totalPayments)}</p>
                      <p className="text-xs text-slate-500">Total Payments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Company details + Quick info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Company Info */}
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 className="size-4 text-emerald-500" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {company.description?.length > 300
                      ? company.description.slice(0, 300) + "..."
                      : company.description || "No description provided."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Industry</span>
                      <p className="text-slate-700 font-medium">{company.industry || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Organization Type</span>
                      <p className="text-slate-700 font-medium">{company.organizationType || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Company Size</span>
                      <p className="text-slate-700 font-medium">{company.size || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Location</span>
                      <p className="text-slate-700 font-medium">
                        {[company.town, company.county, company.country].filter(Boolean).join(", ") || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Contact Email</span>
                      <p className="text-slate-700 font-medium">{company.contactEmail || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone</span>
                      <p className="text-slate-700 font-medium">{company.phoneNumber || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Created</span>
                      <p className="text-slate-700 font-medium">{formatDate(company.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Plan</span>
                      <p>
                        <Badge variant="secondary" className={`text-xs ${planColors[sub?.plan || "FREE"] || ""}`}>
                          {sub?.plan || "FREE"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                      <Zap className="size-4 text-amber-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-sm h-9"
                      onClick={() => setActiveTab("edit")}
                    >
                      <Pencil className="size-3.5" />
                      Edit Company
                    </Button>
                    {company.website && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-sm h-9"
                        onClick={() => window.open(company.website!, "_blank")}
                      >
                        <ExternalLink className="size-3.5" />
                        View Website
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-sm h-9"
                      onClick={() => setActiveTab("subscription")}
                    >
                      <Crown className="size-3.5" />
                      Manage Subscription
                    </Button>
                  </CardContent>
                </Card>

                {/* Subscription summary card */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                      <CreditCard className="size-4 text-emerald-500" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Plan</span>
                      <Badge variant="secondary" className={`text-xs ${planColors[sub?.plan || "FREE"] || ""}`}>
                        {sub?.plan || "FREE"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Status</span>
                      <Badge variant="secondary" className={`text-xs ${statusColors[sub?.status || "ACTIVE"] || ""}`}>
                        {sub?.status || "ACTIVE"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Credits</span>
                      <span className="text-sm font-semibold text-slate-900">{company.creditBalance}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Expires</span>
                      <span className="text-sm text-slate-700">{formatDate(sub?.expiresAt ?? null)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Danger Zone */}
            <Card className="border border-red-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-500" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suspensionInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <AlertTriangle className="size-5 text-red-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-800">Company is Suspended</p>
                        <p className="text-sm text-red-600 mt-1">{suspensionInfo.reason}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-red-500">
                          <span>Suspended by: {suspensionInfo.suspendedBy}</span>
                          <span>·</span>
                          <span>{formatDateTime(suspensionInfo.suspendedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleReactivateCompany}
                      disabled={suspensionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {suspensionLoading ? "Reactivating..." : "Reactivate Company"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-700">Suspending a company will deactivate it and prevent all access.</p>
                      <p className="text-xs text-slate-400 mt-0.5">This action can be reversed later.</p>
                    </div>
                    <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0">
                          Suspend Company
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-red-700">Suspend {company.name}</DialogTitle>
                          <DialogDescription>
                            This will deactivate the company. Please provide a reason for the suspension.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Suspension Reason *</Label>
                            <Textarea
                              value={suspendReason}
                              onChange={(e) => setSuspendReason(e.target.value)}
                              placeholder="e.g. Policy violation, fraudulent activity..."
                              className="border-red-200 min-h-[100px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => { setSuspendDialogOpen(false); setSuspendReason("") }}>Cancel</Button>
                          <Button
                            variant="destructive"
                            onClick={handleSuspendCompany}
                            disabled={!suspendReason.trim() || suspensionLoading}
                          >
                            {suspensionLoading ? "Suspending..." : "Suspend Company"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SUBSCRIPTION & PAYMENTS                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="subscription">
          <div className="space-y-6">
            {/* Subscription card + Credits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current subscription */}
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                      <Crown className="size-4 text-amber-500" />
                      Current Subscription
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Change plan */}
                      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            Change Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Subscription Plan</DialogTitle>
                            <DialogDescription>
                              Select a new plan for {company.name}
                            </DialogDescription>
                          </DialogHeader>
                          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setChangePlanOpen(false)}>Cancel</Button>
                            <Button
                              onClick={handleChangePlan}
                              disabled={!selectedPlan || actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {actionLoading ? "Changing..." : "Change Plan"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Extend */}
                      <Dialog open={extendSubOpen} onOpenChange={setExtendSubOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            <CalendarClock className="size-3 mr-1" />
                            Extend
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Extend Subscription</DialogTitle>
                            <DialogDescription>
                              Add extra days to the subscription
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label>Extension Period (days)</Label>
                              <Select value={extendDays} onValueChange={setExtendDays}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="7">7 days</SelectItem>
                                  <SelectItem value="14">14 days</SelectItem>
                                  <SelectItem value="30">30 days</SelectItem>
                                  <SelectItem value="60">60 days</SelectItem>
                                  <SelectItem value="90">90 days</SelectItem>
                                  <SelectItem value="365">1 year (365 days)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setExtendSubOpen(false)}>Cancel</Button>
                            <Button
                              onClick={handleExtendSubscription}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {actionLoading ? "Extending..." : "Extend Subscription"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Plan</span>
                      <p>
                        <Badge variant="secondary" className={`text-xs ${planColors[sub?.plan || "FREE"] || ""}`}>
                          {sub?.plan || "FREE"}
                        </Badge>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Status</span>
                      <p>
                        <Badge variant="secondary" className={`text-xs ${statusColors[sub?.status || "ACTIVE"] || ""}`}>
                          {sub?.status || "ACTIVE"}
                        </Badge>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Start Date</span>
                      <p className="text-sm text-slate-700">{formatDate(sub?.startedAt ?? null)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Expiry Date</span>
                      <p className="text-sm text-slate-700">{formatDate(sub?.expiresAt ?? null)}</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="size-4 text-slate-400" />
                      <Label className="text-sm text-slate-700">Auto-Renew</Label>
                    </div>
                    <Switch
                      checked={sub?.autoRenew ?? false}
                      onCheckedChange={handleToggleAutoRenew}
                      disabled={actionLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Credits */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                      <Zap className="size-4 text-amber-500" />
                      Credits
                    </CardTitle>
                    <Dialog open={addCreditsOpen} onOpenChange={setAddCreditsOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2">
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Credits</DialogTitle>
                          <DialogDescription>
                            Add credits to {company.name}&apos;s account
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Number of Credits</Label>
                            <Input
                              type="number"
                              min={1}
                              value={creditAmount}
                              onChange={(e) => setCreditAmount(e.target.value)}
                              placeholder="e.g. 100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input
                              value={creditDescription}
                              onChange={(e) => setCreditDescription(e.target.value)}
                              placeholder="e.g. Goodwill credits"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddCreditsOpen(false)}>Cancel</Button>
                          <Button
                            onClick={handleAddCredits}
                            disabled={!creditAmount || actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {actionLoading ? "Adding..." : "Add Credits"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-slate-900">{company.creditBalance}</p>
                  <p className="text-sm text-slate-400 mt-1">Available credits</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment history */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <CreditCard className="size-4 text-emerald-500" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {company.payments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No payment records found
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="hidden sm:table-cell">M-Pesa Receipt</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {company.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-sm">{formatDateTime(payment.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{payment.type}</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{formatKES(payment.amount)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">
                              {payment.mpesaReceiptNumber || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${paymentStatusColors[payment.status] || ""}`}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: PAYMENT HISTORY                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="payments">
          <div className="space-y-6">
            {/* Summary stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <TrendingUp className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatKES(totalRevenue)}</p>
                      <p className="text-xs text-slate-500">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatKES(pendingAmount)}</p>
                      <p className="text-xs text-slate-500">Pending Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                      <X className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatKES(failedAmount)}</p>
                      <p className="text-xs text-slate-500">Failed Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                      <Receipt className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{company.payments.length}</p>
                      <p className="text-xs text-slate-500">Transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment table with filters */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <Receipt className="size-4 text-emerald-500" />
                    Transaction History
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                        <SelectItem value="BOOST">Boost</SelectItem>
                        <SelectItem value="ORDER">Order</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredPayments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    {company.payments.length === 0 ? "No payment records found" : "No payments match the selected filters"}
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="hidden md:table-cell">Description</TableHead>
                          <TableHead className="hidden lg:table-cell">Phone</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden sm:table-cell">M-Pesa Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-sm whitespace-nowrap">{formatDateTime(payment.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${paymentTypeColors[payment.type] || ""}`}>
                                {payment.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-600 max-w-[200px] truncate">
                              {payment.description || "—"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-500 font-mono">
                              {payment.phoneNumber || "—"}
                            </TableCell>
                            <TableCell className="text-sm font-medium">{formatKES(payment.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${paymentStatusColors[payment.status] || ""}`}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500 font-mono">
                              {payment.mpesaReceiptNumber || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: CREDIT LEDGER                                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="credits">
          <div className="space-y-6">
            {/* Credit balance summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{creditLoading ? "—" : creditSummary.currentBalance}</p>
                      <p className="text-xs text-slate-500">Current Balance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <TrendingUp className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">+{creditLoading ? "—" : creditSummary.totalAdded}</p>
                      <p className="text-xs text-slate-500">Total Added</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                      <RotateCcw className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">-{creditLoading ? "—" : creditSummary.totalDeducted}</p>
                      <p className="text-xs text-slate-500">Total Deducted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credit ledger table */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <Zap className="size-4 text-amber-500" />
                    Credit Transaction History
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchCredits} disabled={creditLoading}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {creditLoading ? (
                  <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
                ) : creditLedger.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No credit transactions found</div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="hidden sm:table-cell">Description</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Balance After</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditLedger.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-sm whitespace-nowrap">{formatDateTime(entry.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${creditTypeColors[entry.type] || "bg-gray-100 text-gray-700"}`}>
                                {entry.type.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[250px] truncate">
                              {entry.description}
                            </TableCell>
                            <TableCell className={`text-sm font-medium ${entry.credits >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {entry.credits >= 0 ? `+${entry.credits}` : entry.credits}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-900">{entry.balanceAfter}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: ACTIVITY LOG                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="activity">
          <div className="space-y-6">
            {/* Summary row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                      <History className="size-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{activityLoading ? "—" : activityLogs.length}</p>
                      <p className="text-xs text-slate-500">Total Actions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{activityLoading ? "—" : (activityLogs.length > 0 ? formatDateTime(activityLogs[0].createdAt) : "No actions yet")}</p>
                      <p className="text-xs text-slate-500">Last Action</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity log table */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <History className="size-4 text-slate-500" />
                    Activity Log
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchActivityLogs} disabled={activityLoading}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activityLoading ? (
                  <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
                ) : activityLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No activity recorded yet
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead className="hidden sm:table-cell">Details</TableHead>
                          <TableHead className="hidden md:table-cell">Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${activityActionColors[log.action] || "bg-gray-100 text-gray-700"}`}>
                                {log.action.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-600 max-w-[350px] truncate">
                              {log.details || "—"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-500">
                              {log.adminName || log.adminEmail || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: NOTES                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="notes">
          <div className="space-y-6">
            {/* Add Note */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <StickyNote className="size-4 text-amber-500" />
                  Add Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add an internal note about this company..."
                  className="min-h-[100px] resize-y"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newNotePinned}
                      onCheckedChange={setNewNotePinned}
                      id="pin-note"
                    />
                    <Label htmlFor="pin-note" className="text-sm text-slate-600 flex items-center gap-1.5 cursor-pointer">
                      <Pin className="size-3.5" />
                      Pin note
                    </Label>
                  </div>
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim() || noteSaving}
                    size="sm"
                  >
                    {noteSaving ? "Adding..." : "Add Note"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            <div className="space-y-3">
              {notesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : companyNotes.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <StickyNote className="size-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No notes yet. Add the first note about this company.</p>
                  </CardContent>
                </Card>
              ) : (
                companyNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`border-0 shadow-sm ${note.isPinned ? "border-l-4 border-l-amber-400" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-800">
                            {note.authorName || note.authorEmail || "Unknown"}
                          </span>
                          {note.isPinned && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0">
                              <Pin className="size-2.5 mr-0.5" /> Pinned
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-600 h-7 w-7 p-0 shrink-0"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                        >
                          {deletingNoteId === note.id ? (
                            <RotateCcw className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed mb-2">
                        {note.content}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(note.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 7: TEAM MEMBERS                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="team">
          <div className="space-y-6">
            {/* Active members */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <Users className="size-4 text-emerald-500" />
                    Team Members
                    <Badge variant="secondary" className="text-xs ml-1">{company.members.length}</Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {company.members.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No team members found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden md:table-cell">Joined</TableHead>
                          <TableHead className="hidden lg:table-cell">Last Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {company.members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                                  {member.user.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-900">{member.user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{member.user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${roleColors[member.role] || ""}`}>
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-500">{formatDate(member.joinedAt)}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-500">{formatDateTime(member.lastActiveAt || member.user.lastLoginAt)}</TableCell>
                            <TableCell className="text-right">
                              {member.role !== "OWNER" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setMemberToRemove({ id: member.id, name: member.user.name })
                                    setRemoveMemberOpen(true)
                                  }}
                                >
                                  <Trash2 className="size-3 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending invitations */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <UserPlus className="size-4 text-amber-500" />
                  Pending Invitations
                  <Badge variant="secondary" className="text-xs ml-1">{company.invites.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {company.invites.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No pending invitations
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden sm:table-cell">Invited</TableHead>
                          <TableHead className="hidden sm:table-cell">Expires</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {company.invites.map((invite) => (
                          <TableRow key={invite.id}>
                            <TableCell className="text-sm">{invite.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${roleColors[invite.role] || ""}`}>
                                {invite.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{formatDateTime(invite.createdAt)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-slate-500">{formatDate(invite.expiresAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancelInvite(invite.id)}
                                disabled={actionLoading}
                              >
                                <X className="size-3 mr-1" />
                                Revoke
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Remove member confirmation dialog */}
          <Dialog open={removeMemberOpen} onOpenChange={setRemoveMemberOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Team Member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from this company? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setRemoveMemberOpen(false); setMemberToRemove(null) }}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveMember}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Removing..." : "Remove Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: JOBS                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="jobs">
          <div className="space-y-6">
            {/* Boost stats section */}
            {boostStats && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Zap className="size-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{boostStats.totalBoosts}</p>
                        <p className="text-xs text-slate-500">Total Boosts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp className="size-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{formatKES(boostStats.totalBoostRevenue)}</p>
                        <p className="text-xs text-slate-500">Boost Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <ShieldCheck className="size-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{boostStats.activeBoosts}</p>
                        <p className="text-xs text-slate-500">Active Boosts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <Briefcase className="size-4 text-emerald-500" />
                  Company Jobs
                  <Badge variant="secondary" className="text-xs ml-1">{company.jobs.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{company.stats.activeJobs} active</span>
                  <span>·</span>
                  <span>{company.stats.totalJobs - company.stats.activeJobs} inactive</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={boostedOnly}
                      onChange={(e) => setBoostedOnly(e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 size-3.5"
                    />
                    <span className="text-amber-600 font-medium">Boosted only</span>
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {company.jobs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No jobs posted yet
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Applicants</TableHead>
                        <TableHead className="hidden sm:table-cell">Published</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.jobs
                        .filter(() => !boostedOnly || true) // Boost filter is UI-only; show indicator
                        .map((job) => (
                        <TableRow key={job.id} className="cursor-pointer hover:bg-slate-50"
                          onClick={() => router.push("/dashboard/jobs")}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {boostStats && boostStats.totalBoosts > 0 && (
                                <Zap className="size-3.5 text-amber-500 shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-slate-900">{job.title}</p>
                                <p className="text-xs text-slate-400 sm:hidden">
                                  {job.employmentType} · {job.applicantCount} applicants
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">{job.employmentType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${statusColors[job.status] || ""}`}>
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-600">
                            {job.applicantCount}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                            {formatDate(job.publishedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 7: EDIT COMPANY                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="edit">
          <div className="space-y-5">
            {/* Company Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="size-4 text-emerald-500" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Acme Inc."
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Industry *</Label>
                    <Select
                      value={form.industry}
                      onValueChange={(v) => setForm({ ...form, industry: v })}
                    >
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationIndustry.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell us about this company..."
                    className="border-slate-200"
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Organization Type</Label>
                    <Select
                      value={form.organizationType}
                      onValueChange={(v) => setForm({ ...form, organizationType: v })}
                    >
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationType.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Company Size</Label>
                    <Select
                      value={form.size}
                      onValueChange={(v) => setForm({ ...form, size: v })}
                    >
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationSize.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Website</Label>
                    <Input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://example.com"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Contact Email</Label>
                    <Input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="contact@example.com"
                      className="border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="border-slate-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <Globe className="size-4 text-sky-500" />
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["facebook", "twitter", "linkedin", "instagram"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700 capitalize">{field} URL</Label>
                      <Input
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        placeholder={`https://${field}.com/company`}
                        className="border-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Branding & Location + Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <Palette className="size-4 text-rose-500" />
                    Branding &amp; Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Logo URL</Label>
                    <Input
                      value={form.logo}
                      onChange={(e) => setForm({ ...form, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Logo Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={form.logoColor || "#000000"}
                        onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                        className="w-10 h-10 p-1 cursor-pointer rounded-lg border-slate-200"
                      />
                      <Input
                        value={form.logoColor}
                        onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Country</Label>
                      <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v, county: "", town: "" })}>
                        <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                          {organizationLocation.map((loc) => (
                            <SelectItem key={loc.code} value={loc.name}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">County / Region</Label>
                      <Select value={form.county} onValueChange={(v) => setForm({ ...form, county: v, town: "" })}>
                        <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select county" /></SelectTrigger>
                        <SelectContent>
                          {organizationLocation.find((c) => c.name === form.country)?.regions.map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Town</Label>
                    <Input
                      value={form.town}
                      onChange={(e) => setForm({ ...form, town: e.target.value })}
                      placeholder="e.g. Westlands"
                      className="border-slate-200"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <Settings2 className="size-4 text-amber-500" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={form.isVerified}
                      onCheckedChange={(checked) => setForm({ ...form, isVerified: !!checked })}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label className="text-sm text-slate-700 cursor-pointer">Verified</Label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={form.isFeatured}
                      onCheckedChange={(checked) => setForm({ ...form, isFeatured: !!checked })}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label className="text-sm text-slate-700 cursor-pointer">Featured</Label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label className="text-sm text-slate-700 cursor-pointer">Active</Label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={form.noIndex}
                      onCheckedChange={(checked) => setForm({ ...form, noIndex: !!checked })}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label className="text-sm text-slate-700 cursor-pointer">No Index</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SEO */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <Search className="size-4 text-rose-500" />
                  SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Meta Title</Label>
                    <Input
                      value={form.metaTitle}
                      onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                      placeholder="Custom meta title for search engines"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">OG Image URL</Label>
                    <Input
                      type="url"
                      value={form.ogImage}
                      onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                      placeholder="https://example.com/og-image.jpg"
                      className="border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Meta Description</Label>
                  <Textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    placeholder="Custom meta description for search engines"
                    className="border-slate-200"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              <FileImportButton
                onDataExtracted={(data) =>
                  setForm((prev) => ({
                    ...prev,
                    ...Object.fromEntries(
                      Object.entries(data)
                        .filter(([, v]) => v !== undefined && v !== null)
                        .map(([k, v]) => [k, typeof v === "number" ? String(v) : v])
                    ),
                  }))
                }
                variant="outline"
                size="sm"
              />
              <Button
                onClick={handleSave}
                disabled={
                  saving || !form.name.trim() || !form.industry.trim() || !form.description.trim()
                }
                className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {saving ? "Saving..." : "Save Changes →"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
