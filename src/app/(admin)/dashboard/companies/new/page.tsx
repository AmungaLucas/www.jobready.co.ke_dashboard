"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TiptapEditor } from "@/components/tiptap-editor"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { FileImportButton } from "@/components/file-import-button"
import { Building2, Globe, Palette, Settings2, Search, ArrowLeft } from "lucide-react"
import { organizationType, organizationIndustry, organizationSize, organizationLocation } from "@/constants/enums"

export default function NewCompanyPage() {
  const router = useRouter()
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Company created successfully")
        router.push("/dashboard/companies")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to create company")
      }
    } catch {
      toast.error("Failed to create company")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/companies")}
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 mb-6"
      >
        <ArrowLeft className="size-3.5" />
        Back to Companies
      </button>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Company</h1>
            <p className="text-slate-500 mt-0.5">Add a new organization to the platform</p>
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
            onClick={() => router.push("/dashboard/companies")}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-5">
        {/* Company Information */}
        <Card className="border border-slate-200 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="size-4 text-teal-500" />
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
              <TiptapEditor
                content={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Tell us about this company..."
              />
              <p className="text-xs text-slate-400">A brief overview of the company&apos;s mission and activities</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                <Input
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="+254 700 000 000"
                  className="border-slate-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="border border-slate-200 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
              <Globe className="size-4 text-sky-500" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Facebook URL</Label>
                <Input
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  placeholder="https://facebook.com/company"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Twitter URL</Label>
                <Input
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  placeholder="https://twitter.com/company"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">LinkedIn URL</Label>
                <Input
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Instagram URL</Label>
                <Input
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="https://instagram.com/company"
                  className="border-slate-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding & Location + Settings (2-col grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Branding & Location */}
          <Card className="border border-slate-200 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Palette className="size-4 text-indigo-500" />
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
                <p className="text-xs text-slate-400">Direct link to the company logo image</p>
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

          {/* Settings */}
          <Card className="border border-slate-200 rounded-xl">
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
                  className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <Label className="text-sm text-slate-700 cursor-pointer">Verified</Label>
              </div>
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={form.isFeatured}
                  onCheckedChange={(checked) => setForm({ ...form, isFeatured: !!checked })}
                  className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <Label className="text-sm text-slate-700 cursor-pointer">Featured</Label>
              </div>
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
                  className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <Label className="text-sm text-slate-700 cursor-pointer">Active</Label>
              </div>
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={form.noIndex}
                  onCheckedChange={(checked) => setForm({ ...form, noIndex: !!checked })}
                  className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <Label className="text-sm text-slate-700 cursor-pointer">No Index</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEO */}
        <Card className="border border-slate-200 rounded-xl">
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
              <p className="text-xs text-slate-400">Recommended length: 120-160 characters</p>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleSave}
              disabled={
                saving || !form.name.trim() || !form.industry.trim() || !form.description.trim()
              }
              className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {saving ? "Saving..." : "Save Company →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
