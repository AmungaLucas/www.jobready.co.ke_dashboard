"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
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

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const [showCompanyList, setShowCompanyList] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
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
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/companies/list").then((r) => r.json()),
      fetch(`/api/admin/jobs?search=${jobId}`).then((r) => r.json()),
    ])
      .then(([companyData, jobsData]) => {
        setCompanies(companyData)
        const job = jobsData.jobs?.find((j: { id: string }) => j.id === jobId)
        if (job) {
          setForm({
            title: job.title || "",
            description: job.description || "",
            shortDescription: job.shortDescription || "",
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
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [jobId])

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const handleSave = async (status: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, ...form, status }),
      })
      if (res.ok) {
        toast.success("Job updated successfully")
        router.push("/dashboard/jobs")
      } else {
        toast.error("Failed to update job")
      }
    } catch {
      toast.error("Failed to update job")
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
          <h1 className="text-2xl font-bold text-slate-900">Edit Job</h1>
          <p className="text-slate-500 mt-1">{form.title}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/jobs")}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Job Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Full Description *</Label>
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
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Salary Min (KES)</Label>
                  <Input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Salary Max (KES)</Label>
                  <Input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Salary Period</Label>
                  <Select value={form.salaryPeriod} onValueChange={(v) => setForm({ ...form, salaryPeriod: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="ANNUALLY">Annually</SelectItem>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Positions</Label>
                  <Input type="number" value={form.positions} onChange={(e) => setForm({ ...form, positions: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isSalaryNegotiable} onChange={(e) => setForm({ ...form, isSalaryNegotiable: e.target.checked })} className="rounded" />
                <Label>Salary is negotiable</Label>
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
                <Label>Application Deadline</Label>
                <Input type="date" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} className="mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
                <Label>Featured Job</Label>
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
                  className="mt-0"
                />
                {showCompanyList && companySearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
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
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Employment Type</Label>
                <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
              <div>
                <Label>Experience Level</Label>
                <Select value={form.experienceLevel} onValueChange={(v) => setForm({ ...form, experienceLevel: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
              <div>
                <Label>Industry</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>County</Label>
                  <Input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Town</Label>
                  <Input value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm({ ...form, isRemote: e.target.checked })} className="rounded" />
                <Label>Remote position</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={() => handleSave("DRAFT")} disabled={saving} variant="outline" className="flex-1">
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button onClick={() => handleSave("PUBLISHED")} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? "Publishing..." : "Update & Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
