"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TiptapEditor } from "@/components/tiptap-editor"
import { employmentType, experienceLevel, organizationIndustry, currencies, jobStatus, jobCategory, organizationLocation } from "@/constants/enums"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { FileImportButton } from "@/components/file-import-button"
import { Briefcase, MapPin, Banknote, Building2, Settings2, Tag, Search, ArrowLeft, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function NewJobPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<{ id: string; name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const [showCompanyList, setShowCompanyList] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: "", industry: "", description: "" })
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [pickerCategory, setPickerCategory] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    featuredImage: "",
    categories: [] as { category: string; subcategory: string }[],
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
    fetch("/api/admin/companies/list")
      .then((r) => r.json())
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
        categories: form.categories.length > 0 ? form.categories : null,
        tags: form.tags
          ? form.tags.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        status,
      }
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(status === "PUBLISHED" ? "Job published!" : "Job saved as draft")
        router.push("/dashboard/jobs")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save job")
      }
    } catch {
      toast.error("Failed to save job")
    } finally {
      setSaving(false)
    }
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Job</h1>
            <p className="text-slate-500 mt-0.5">Add a new job listing to the platform</p>
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
                <Label className="text-sm font-medium text-slate-700">Description *</Label>
                <TiptapEditor
                  content={form.description}
                  onChange={(html) => setForm({ ...form, description: html })}
                  placeholder="Full job description with responsibilities, requirements, etc."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">How to Apply</Label>
                <TiptapEditor
                  content={form.howToApply}
                  onChange={(html) => setForm({ ...form, howToApply: html })}
                  placeholder="Instructions for applicants..."
                  compact
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
                      {employmentType.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Experience Level</Label>
                  <Select value={form.experienceLevel} onValueChange={(v) => setForm({ ...form, experienceLevel: v })}>
                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {experienceLevel.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Industry</Label>
                  <Select
                    value={form.industry}
                    onValueChange={(v) => setForm({ ...form, industry: v })}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-blue-400">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationIndustry.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v, county: "", town: "" })}>
                    <SelectTrigger className="border-slate-200 focus:border-blue-400"><SelectValue placeholder="Select country" /></SelectTrigger>
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
                    <SelectTrigger className="border-slate-200 focus:border-blue-400"><SelectValue placeholder="Select county" /></SelectTrigger>
                    <SelectContent>
                      {organizationLocation.find((c) => c.name === form.country)?.regions.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {currencies.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
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
                    {jobStatus.filter((s) => ["DRAFT", "PUBLISHED"].includes(s.value)).map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
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
              {loading ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <>
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
                        <div className="px-3 py-2.5 text-sm">
                          <p className="text-slate-400 mb-2">No companies found</p>
                          <button
                            type="button"
                            onClick={() => setShowCreateCompany(true)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                          >
                            <Plus className="size-3.5" />
                            Create new company
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
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
                <div className="flex gap-2">
                  <Select
                    value=""
                    onValueChange={(v) => {
                      const sub = jobCategory.find((c) => c.value === v)
                      if (sub && sub.subcategories.length > 0) {
                        setPickerCategory(v)
                      } else {
                        setForm((prev) => ({
                          ...prev,
                          categories: [...prev.categories, { category: v, subcategory: "" }],
                        }))
                        setPickerCategory("")
                      }
                    }}
                  >
                    <SelectTrigger className="border-slate-200 flex-1"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {jobCategory.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pickerCategory && (
                    <Select
                      value=""
                      onValueChange={(v) => {
                        setForm((prev) => ({
                          ...prev,
                          categories: [...prev.categories, { category: pickerCategory, subcategory: v }],
                        }))
                        setPickerCategory("")
                      }}
                    >
                      <SelectTrigger className="border-slate-200 flex-1"><SelectValue placeholder="Subcategory" /></SelectTrigger>
                      <SelectContent>
                        {jobCategory
                          .find((c) => c.value === pickerCategory)
                          ?.subcategories.map((sub) => (
                            <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {form.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.categories.map((item, i) => {
                      const catLabel = jobCategory.find((c) => c.value === item.category)?.label || item.category
                      const subLabel = jobCategory
                        .find((c) => c.value === item.category)
                        ?.subcategories.find((s) => s.value === item.subcategory)?.label || item.subcategory
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                        >
                          {subLabel ? `${catLabel} › ${subLabel}` : catLabel}
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, categories: prev.categories.filter((_, idx) => idx !== i) }))}
                            className="hover:text-blue-900"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
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
              <Select value={newCompany.industry} onValueChange={(v) => setNewCompany({ ...newCompany, industry: v })}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {organizationIndustry.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            Publish &rarr;
          </Button>
        </div>
      </div>
    </div>
  )
}
