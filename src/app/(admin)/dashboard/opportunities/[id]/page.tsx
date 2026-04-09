"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Company {
  id: string
  name: string
  slug: string
}

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

export default function EditOpportunityPage() {
  const router = useRouter()
  const params = useParams()
  const opportunityId = params.id as string

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const [showCompanyList, setShowCompanyList] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    excerpt: "",
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
    Promise.all([
      fetch("/api/admin/companies/list").then((r) => r.json()),
      fetch(`/api/admin/opportunities?search=${opportunityId}`).then((r) => r.json()),
    ])
      .then(([companyData, opportunitiesData]) => {
        setCompanies(companyData)
        const opportunity = opportunitiesData.items?.find(
          (o: { id: string }) => o.id === opportunityId
        )
        if (opportunity) {
          setForm({
            title: opportunity.title || "",
            description: opportunity.description || "",
            excerpt: opportunity.excerpt || "",
            featuredImage: opportunity.featuredImage || "",
            tags: Array.isArray(opportunity.tags)
              ? (opportunity.tags as string[]).join(", ")
              : "",
            companyId: opportunity.companyId || "",
            companyName: opportunity.company?.name || "",
            opportunityType: opportunity.opportunityType || "SCHOLARSHIP",
            deadline: opportunity.deadline
              ? opportunity.deadline.split("T")[0]
              : "",
            howToApply: opportunity.howToApply || "",
            status: opportunity.status || "DRAFT",
            isFeatured: opportunity.isFeatured || false,
            isActive: opportunity.isActive !== undefined ? opportunity.isActive : true,
            noIndex: opportunity.noIndex || false,
            metaTitle: opportunity.metaTitle || "",
            metaDescription: opportunity.metaDescription || "",
            ogImage: opportunity.ogImage || "",
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [opportunityId])

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
          ? form.tags.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        companyId: form.companyId || null,
        status,
      }
      const res = await fetch("/api/admin/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: opportunityId, ...payload }),
      })
      if (res.ok) {
        toast.success("Opportunity updated successfully")
        router.push("/dashboard/opportunities")
      } else {
        toast.error("Failed to update opportunity")
      }
    } catch {
      toast.error("Failed to update opportunity")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Opportunity</h1>
          <p className="text-slate-500 mt-1">{form.title}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/opportunities")}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Opportunity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                  rows={12}
                />
              </div>
              <div>
                <Label>How to Apply</Label>
                <Textarea
                  value={form.howToApply}
                  onChange={(e) => setForm({ ...form, howToApply: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Featured Image URL</Label>
                <Input
                  value={form.featuredImage}
                  onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="Enter tags separated by commas"
                  className="mt-1"
                />
                <p className="text-xs text-slate-400 mt-1">Comma-separated values</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Opportunity Type</Label>
                <Select value={form.opportunityType} onValueChange={(v) => setForm({ ...form, opportunityType: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {opportunityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.isFeatured}
                  onCheckedChange={(checked) => setForm({ ...form, isFeatured: !!checked })}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.noIndex}
                  onCheckedChange={(checked) => setForm({ ...form, noIndex: !!checked })}
                />
                <Label>No Index (hide from search engines)</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  value={form.companyName}
                  onChange={(e) => {
                    setForm({ ...form, companyName: e.target.value, companyId: "" })
                    setCompanySearch(e.target.value)
                    setShowCompanyList(true)
                  }}
                  onFocus={() => setShowCompanyList(true)}
                  placeholder="Search company..."
                  className="mt-0"
                />
                {showCompanyList && companySearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setForm({ ...form, companyId: company.id, companyName: company.name })
                          setShowCompanyList(false)
                        }}
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Optional — leave blank if not associated with a company</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="Custom meta title for search engines"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="Custom meta description for search engines"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>OG Image URL</Label>
                <Input
                  value={form.ogImage}
                  onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  placeholder="https://example.com/og-image.jpg"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={() => handleSave("DRAFT")}
              disabled={saving}
              variant="outline"
              className="flex-1"
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={() => handleSave("PUBLISHED")}
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? "Publishing..." : "Update & Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
