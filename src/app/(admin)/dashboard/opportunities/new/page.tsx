"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TiptapEditor } from "@/components/tiptap-editor"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { FileImportButton } from "@/components/file-import-button"
import {
  Sparkles,
  Settings2,
  Building2,
  Search,
  ArrowLeft,
  Megaphone,
  Globe,
  Plus,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const opportunityTypes = [
  "SCHOLARSHIP",
  "FELLOWSHIP",
  "INTERNSHIP",
  "BURSARY",
  "GRANT",
  "TRAINING",
  "COMPETITION",
  "MENTORSHIP",
  "VOLUNTEER",
  "CONFERENCE",
  "OTHER",
]

export default function NewOpportunityPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<
    { id: string; name: string; slug: string }[]
  >([])
  const [saving, setSaving] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const [showCompanyList, setShowCompanyList] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: "", industry: "", description: "" })
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    featuredImage: "",
    tags: "",
    companyId: "",
    companyName: "",
    opportunityType: "SCHOLARSHIP",
    deadline: "",
    howToApply: "",
    status: "DRAFT",
    isFeatured: false,
    isActive: true,
    noIndex: false,
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
  })

  useEffect(() => {
    fetch("/api/admin/companies/list")
      .then((r) => r.json())
      .then(setCompanies)
      .catch(console.error)
  }, [])

  // Close company dropdown on outside click
  useEffect(() => {
    if (!showCompanyList) return
    const handler = () => setShowCompanyList(false)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [showCompanyList])

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const handleSave = async (status: string) => {
    if (!form.title) {
      toast.error("Title is required")
      return
    }
    if (!form.description) {
      toast.error("Description is required")
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        companyId: form.companyId || null,
        status,
      }
      const res = await fetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(
          status === "PUBLISHED"
            ? "Opportunity published!"
            : "Opportunity saved as draft"
        )
        router.push("/dashboard/opportunities")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save opportunity")
      }
    } catch {
      toast.error("Failed to save opportunity")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/opportunities")}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 mb-6"
      >
        <ArrowLeft className="size-3.5" />
        Back to Opportunities
      </button>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2.5 bg-violet-50 text-violet-600 rounded-xl">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create New Opportunity
            </h1>
            <p className="text-slate-500 mt-0.5">
              Add a new opportunity listing to the platform
            </p>
          </div>
        </div>
        <div className="flex items-end gap-3 flex-shrink-0">
          <FileImportButton
            onDataExtracted={(data) =>
              setForm((prev) => ({
                ...prev,
                ...Object.fromEntries(
                  Object.entries(data)
                    .filter(([, v]) => v !== undefined && v !== null)
                    .map(([k, v]) => [
                      k,
                      typeof v === "number" ? String(v) : v,
                    ])
                ),
              }))
            }
            variant="outline"
            size="sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/opportunities")}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — Details */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Megaphone className="size-4 text-violet-500" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Title <span className="text-rose-400">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="e.g. Google Africa PhD Fellowship 2025"
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Description <span className="text-rose-400">*</span>
                </Label>
                <TiptapEditor
                  content={form.description}
                  onChange={(html) => setForm({ ...form, description: html })}
                  placeholder="Full opportunity description with details, requirements, benefits, etc."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  How to Apply
                </Label>
                <TiptapEditor
                  content={form.howToApply}
                  onChange={(html) => setForm({ ...form, howToApply: html })}
                  placeholder="Instructions for applicants..."
                  compact
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Featured Image
                </Label>
                <Input
                  value={form.featuredImage}
                  onChange={(e) =>
                    setForm({ ...form, featuredImage: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Tags
                </Label>
                <Input
                  value={form.tags}
                  onChange={(e) =>
                    setForm({ ...form, tags: e.target.value })
                  }
                  placeholder="e.g. technology, research, funding"
                  className="border-slate-200"
                />
                <p className="text-xs text-slate-400">
                  Comma-separated values
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — Publishing */}
        <div className="space-y-5">
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Settings2 className="size-4 text-amber-500" />
                Publishing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Deadline
                </Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Opportunity Type
                </Label>
                <Select
                  value={form.opportunityType}
                  onValueChange={(v) =>
                    setForm({ ...form, opportunityType: v })
                  }
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={form.isFeatured}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, isFeatured: !!checked })
                    }
                    className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Label className="text-sm text-slate-700 cursor-pointer">
                    Featured
                  </Label>
                </div>

                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, isActive: !!checked })
                    }
                    className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Label className="text-sm text-slate-700 cursor-pointer">
                    Active
                  </Label>
                </div>

                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={form.noIndex}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, noIndex: !!checked })
                    }
                    className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Label className="text-sm text-slate-700 cursor-pointer">
                    No Index
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-width sections */}
      <div className="mt-5 space-y-5">
        {/* Company card */}
        <Card className="border border-slate-200 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="size-4 text-teal-500" />
              Company{" "}
              <span className="text-xs font-normal text-slate-400">
                (optional)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={form.companyName}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      companyName: e.target.value,
                      companyId: "",
                    })
                    setCompanySearch(e.target.value)
                    setShowCompanyList(true)
                  }}
                  onFocus={() => setShowCompanyList(true)}
                  placeholder="Search company..."
                  className="border-slate-200 pl-9"
                />
              </div>
              {showCompanyList && companySearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors first:rounded-t-[10px] last:rounded-b-[10px]"
                        onClick={() => {
                          setForm({
                            ...form,
                            companyId: company.id,
                            companyName: company.name,
                          })
                          setShowCompanyList(false)
                        }}
                      >
                        <span className="text-slate-800">{company.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm">
                      <p className="text-slate-400 mb-2">No companies found</p>
                      <button
                        type="button"
                        onClick={() => setShowCreateCompany(true)}
                        className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors"
                      >
                        <Plus className="size-3.5" />
                        Create new company
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Optional — leave blank if not associated with a company
            </p>
          </CardContent>
        </Card>

        {/* SEO card */}
        <Card className="border border-slate-200 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
              <Globe className="size-4 text-rose-500" />
              SEO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Meta Title
                </Label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) =>
                    setForm({ ...form, metaTitle: e.target.value })
                  }
                  placeholder="Custom meta title for search engines"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  OG Image
                </Label>
                <Input
                  value={form.ogImage}
                  onChange={(e) =>
                    setForm({ ...form, ogImage: e.target.value })
                  }
                  placeholder="https://example.com/og-image.jpg"
                  className="border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Meta Description
              </Label>
              <Textarea
                value={form.metaDescription}
                onChange={(e) =>
                  setForm({ ...form, metaDescription: e.target.value })
                }
                placeholder="Custom meta description for search engines"
                className="border-slate-200"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Create Company Dialog */}
        <Dialog open={showCreateCompany} onOpenChange={setShowCreateCompany}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>Add a new company to the platform. You can edit details later.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Company Name *</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="e.g. Acme Inc."
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Industry *</Label>
                <Input
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  placeholder="e.g. Technology, Healthcare"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Description *</Label>
                <Textarea
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                  placeholder="Brief description of the company..."
                  className="border-slate-200 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateCompany(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!newCompany.name.trim() || !newCompany.industry.trim() || !newCompany.description.trim()) {
                    toast.error("Name, industry, and description are required")
                    return
                  }
                  setCreatingCompany(true)
                  try {
                    const res = await fetch("/api/admin/companies", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: newCompany.name,
                        industry: newCompany.industry,
                        description: newCompany.description,
                      }),
                    })
                    if (res.ok) {
                      const company = await res.json()
                      setCompanies((prev) => [...prev, { id: company.id, name: company.name, slug: company.slug }])
                      setForm({ ...form, companyId: company.id, companyName: company.name })
                      setShowCreateCompany(false)
                      setShowCompanyList(false)
                      setNewCompany({ name: "", industry: "", description: "" })
                      toast.success("Company created and selected!")
                    } else {
                      const err = await res.json()
                      toast.error(err.error || "Failed to create company")
                    }
                  } catch {
                    toast.error("Failed to create company")
                  } finally {
                    setCreatingCompany(false)
                  }
                }}
                disabled={creatingCompany}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {creatingCompany ? "Creating..." : "Create & Select"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Action buttons */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={saving || !form.title}
            className="px-6"
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving || !form.title || !form.description}
            className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            Publish →
          </Button>
        </div>
      </div>
    </div>
  )
}
