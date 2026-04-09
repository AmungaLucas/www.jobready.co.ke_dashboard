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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { FileImportButton } from "@/components/file-import-button"
import { Briefcase, MapPin, Banknote, Building2, Settings2, Tag, Search, ArrowLeft } from "lucide-react"

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [companies, setCompanies] = useState<{ id: string; name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const [showCompanyList, setShowCompanyList] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    featuredImage: "",
    categories: "",
    tags: "",
    companyId: "",
    companyName: "",
    country: "Kenya",
    county: "",
    town: "",
    isRemote: false,
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "KES",
    salaryPeriod: "MONTHLY",
    isSalaryNegotiable: false,
    employmentType: "FULL_TIME",
    experienceLevel: "ENTRY_LEVEL",
    industry: "",
    positions: "1",
    applicationDeadline: "",
    howToApply: "",
    status: "DRAFT",
    isFeatured: false,
    isActive: true,
    metaTitle: "",
    metaDescription: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/companies/list").then((r) => r.json()),
      fetch(`/api/admin/jobs/${id}`).then((r) => r.json()),
    ])
      .then(([companyData, job]) => {
        setCompanies(companyData)
        if (!job) {
          toast.error("Job not found")
          router.push("/dashboard/jobs")
          return
        }
        setForm({
          title: job.title || "",
          description: job.description || "",
          shortDescription: job.shortDescription || "",
          featuredImage: job.featuredImage || "",
          categories: Array.isArray(job.categories) ? job.categories.join(", ") : "",
          tags: Array.isArray(job.tags) ? job.tags.join(", ") : "",
          companyId: job.companyId || "",
          companyName: job.company?.name || "",
          country: job.country || "Kenya",
          county: job.county || "",
          town: job.town || "",
          isRemote: job.isRemote || false,
          salaryMin: job.salaryMin ? String(job.salaryMin) : "",
          salaryMax: job.salaryMax ? String(job.salaryMax) : "",
          salaryCurrency: job.salaryCurrency || "KES",
          salaryPeriod: job.salaryPeriod || "MONTHLY",
          isSalaryNegotiable: job.isSalaryNegotiable || false,
          employmentType: job.employmentType || "FULL_TIME",
          experienceLevel: job.experienceLevel || "ENTRY_LEVEL",
          industry: job.industry || "",
          positions: job.positions ? String(job.positions) : "1",
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split("T")[0] : "",
          howToApply: job.howToApply || "",
          status: job.status || "DRAFT",
          isFeatured: job.isFeatured || false,
          isActive: job.isActive !== undefined ? job.isActive : true,
          metaTitle: job.metaTitle || "",
          metaDescription: job.metaDescription || "",
        })
      })
      .catch(() => toast.error("Failed to load job"))
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-company-dropdown]")) {
        setShowCompanyList(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const handleSave = async (status: string) => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        categories: form.categories
          ? form.categories.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        tags: form.tags
          ? form.tags.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        status,
      }
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      })
      if (res.ok) {
        toast.success("Job updated successfully")
        router.push("/dashboard/jobs")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update job")
      }
    } catch {
      toast.error("Failed to update job")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/jobs")}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 mb-6"
      >
        <ArrowLeft className="size-3.5" />
        Back to Jobs
      </button>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Job</h1>
            <p className="text-slate-500 mt-0.5">Editing: {form.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/jobs")}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* ── Job Details ── */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase className="size-4 text-blue-500" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className="border-slate-200 focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Short Description</Label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  placeholder="Brief summary of the job (1-2 sentences)"
                  className="border-slate-200 focus:border-blue-400 resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Full job description with responsibilities, requirements, etc."
                  className="border-slate-200 focus:border-blue-400 resize-none"
                  rows={12}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">How to Apply</Label>
                <Textarea
                  value={form.howToApply}
                  onChange={(e) => setForm({ ...form, howToApply: e.target.value })}
                  placeholder="Instructions for applicants"
                  className="border-slate-200 focus:border-blue-400 resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Featured Image</Label>
                <Input
                  value={form.featuredImage}
                  onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="border-slate-200 focus:border-blue-400"
                />
                <p className="text-xs text-slate-400">Enter a URL for the featured image</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Location & Type ── */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="size-4 text-emerald-500" />
                Location &amp; Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Employment Type</Label>
                  <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full-time</SelectItem>
                      <SelectItem value="PART_TIME">Part-time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                      <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Experience Level</Label>
                  <Select value={form.experienceLevel} onValueChange={(v) => setForm({ ...form, experienceLevel: v })}>
                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRY_LEVEL">Entry Level</SelectItem>
                      <SelectItem value="MID_LEVEL">Mid Level</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="DIRECTOR">Director</SelectItem>
                      <SelectItem value="EXECUTIVE">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Industry</Label>
                  <Input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    placeholder="e.g. Technology"
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Positions</Label>
                  <Input
                    type="number"
                    value={form.positions}
                    onChange={(e) => setForm({ ...form, positions: e.target.value })}
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Country</Label>
                  <Input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">County</Label>
                  <Input
                    value={form.county}
                    onChange={(e) => setForm({ ...form, county: e.target.value })}
                    placeholder="e.g. Nairobi"
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Town</Label>
                  <Input
                    value={form.town}
                    onChange={(e) => setForm({ ...form, town: e.target.value })}
                    placeholder="e.g. Westlands"
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center gap-2.5 pt-6">
                  <Checkbox
                    checked={form.isRemote}
                    onCheckedChange={(checked) => setForm({ ...form, isRemote: !!checked })}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label className="text-sm text-slate-700 cursor-pointer">Remote position</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Compensation ── */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Banknote className="size-4 text-purple-500" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Currency</Label>
                <Select value={form.salaryCurrency} onValueChange={(v) => setForm({ ...form, salaryCurrency: v })}>
                  <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="TZS">TZS (Tanzanian Shilling)</SelectItem>
                    <SelectItem value="UGX">UGX (Ugandan Shilling)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Min</Label>
                  <Input
                    type="number"
                    value={form.salaryMin}
                    onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                    placeholder="e.g. 50000"
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Max</Label>
                  <Input
                    type="number"
                    value={form.salaryMax}
                    onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                    placeholder="e.g. 120000"
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Period</Label>
                <Select value={form.salaryPeriod} onValueChange={(v) => setForm({ ...form, salaryPeriod: v })}>
                  <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={form.isSalaryNegotiable}
                  onCheckedChange={(checked) => setForm({ ...form, isSalaryNegotiable: !!checked })}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label className="text-sm text-slate-700 cursor-pointer">Salary is negotiable</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-5">
          {/* ── Publishing ── */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Settings2 className="size-4 text-amber-500" />
                Publishing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Application Deadline</Label>
                <Input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
                  className="border-slate-200 focus:border-blue-400"
                />
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={form.isFeatured}
                    onCheckedChange={(checked) => setForm({ ...form, isFeatured: !!checked })}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label className="text-sm text-slate-700 cursor-pointer">Featured Job</Label>
                </div>
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label className="text-sm text-slate-700 cursor-pointer">Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── SEO ── */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Search className="size-4 text-rose-500" />
                SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Meta Title</Label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="Custom meta title for search engines"
                  className="border-slate-200 focus:border-blue-400"
                />
                <p className="text-xs text-slate-400">Leave empty to auto-generate from title</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Meta Description</Label>
                <Textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="Custom meta description for search engines"
                  className="border-slate-200 focus:border-blue-400 resize-none"
                  rows={3}
                />
                <p className="text-xs text-slate-400">Leave empty to auto-generate from short description</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-width sections below the grid */}
      <div className="mt-5 space-y-5">
        {/* ── Company ── */}
        <Card className="border border-slate-200 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="size-4 text-teal-500" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative" data-company-dropdown>
              <Input
                value={form.companyName}
                onChange={(e) => {
                  setForm({ ...form, companyName: e.target.value, companyId: "" })
                  setCompanySearch(e.target.value)
                  setShowCompanyList(true)
                }}
                onFocus={() => setShowCompanyList(true)}
                placeholder="Search company..."
                className="border-slate-200 focus:border-blue-400"
              />
              {showCompanyList && companySearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setForm({ ...form, companyId: company.id, companyName: company.name })
                          setShowCompanyList(false)
                        }}
                      >
                        <span className="text-slate-800">{company.name}</span>
                        <span className="text-xs text-slate-400 ml-2">{company.slug}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2.5 text-sm text-slate-400">No companies found</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Tags & Categories ── */}
        <Card className="border border-slate-200 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
              <Tag className="size-4 text-sky-500" />
              Tags &amp; Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Categories</Label>
                <Input
                  value={form.categories}
                  onChange={(e) => setForm({ ...form, categories: e.target.value })}
                  placeholder="e.g. Engineering, Design"
                  className="border-slate-200 focus:border-blue-400"
                />
                <p className="text-xs text-slate-400">Comma-separated values</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. React, Remote, Urgent"
                  className="border-slate-200 focus:border-blue-400"
                />
                <p className="text-xs text-slate-400">Comma-separated values</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            Update &amp; Publish &rarr;
          </Button>
        </div>
      </div>
    </div>
  )
}
