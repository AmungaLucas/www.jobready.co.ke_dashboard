"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Company</h1>
          <p className="text-slate-500 mt-1">Add a new organization to the platform</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/companies")}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Acme Inc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Industry *</Label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. Technology, Healthcare, Finance"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell us about this company..."
                  className="mt-1"
                  rows={8}
                />
              </div>
              <div>
                <Label>Organization Type</Label>
                <Select value={form.organizationType} onValueChange={(v) => setForm({ ...form, organizationType: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE_COMPANY">Private Company</SelectItem>
                    <SelectItem value="PUBLIC_COMPANY">Public Company</SelectItem>
                    <SelectItem value="NGO">NGO</SelectItem>
                    <SelectItem value="GOVERNMENT">Government</SelectItem>
                    <SelectItem value="STARTUP">Startup</SelectItem>
                    <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                    <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                    <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                    <SelectItem value="EDUCATIONAL_INSTITUTION">Educational Institution</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size</Label>
                <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTUP_1_10">Startup (1-10)</SelectItem>
                    <SelectItem value="SMALL_11_50">Small (11-50)</SelectItem>
                    <SelectItem value="MEDIUM_51_200">Medium (51-200)</SelectItem>
                    <SelectItem value="LARGE_201_500">Large (201-500)</SelectItem>
                    <SelectItem value="ENTERPRISE_501_1000">Enterprise (501-1000)</SelectItem>
                    <SelectItem value="CORPORATION_1000+">Corporation (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Facebook URL</Label>
                <Input
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  placeholder="https://facebook.com/company"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Twitter URL</Label>
                <Input
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  placeholder="https://twitter.com/company"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>LinkedIn URL</Label>
                <Input
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Instagram URL</Label>
                <Input
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="https://instagram.com/company"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Branding */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Logo Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    type="color"
                    value={form.logoColor || "#000000"}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>County</Label>
                <Input
                  value={form.county}
                  onChange={(e) => setForm({ ...form, county: e.target.value })}
                  placeholder="e.g. Nairobi"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Town</Label>
                <Input
                  value={form.town}
                  onChange={(e) => setForm({ ...form, town: e.target.value })}
                  placeholder="e.g. Westlands"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.isVerified}
                  onCheckedChange={(checked) => setForm({ ...form, isVerified: !!checked })}
                />
                <Label>Verified</Label>
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
                <Label>No Index (exclude from search engines)</Label>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
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
                  type="url"
                  value={form.ogImage}
                  onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  placeholder="https://example.com/og-image.jpg"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.industry.trim() || !form.description.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
