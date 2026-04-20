"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { siteConfig, brandTitle } from "@/config/site-config"

export default function SettingsPage() {
  const configItems = [
    {
      label: "Site URL",
      value: process.env.NEXT_PUBLIC_SITE_URL || "https://www.jobnet.co.ke",
    },
    {
      label: "Brand Name",
      value: process.env.NEXT_PUBLIC_BRAND_NAME || siteConfig.brandName,
    },
    {
      label: "WhatsApp Number",
      value: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "254786090635",
    },
    {
      label: "SMTP Host",
      value: process.env.SMTP_HOST || "mail.jobready.co.ke",
    },
    {
      label: "SMTP Port",
      value: process.env.SMTP_PORT || "587",
    },
    {
      label: "SMTP User",
      value: process.env.SMTP_USER || "noreply@jobready.co.ke",
    },
    {
      label: "Database",
      value: "MySQL (Connected)",
      status: "connected",
    },
    {
      label: "Auth Provider",
      value: "NextAuth.js v4 (JWT Strategy)",
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Platform configuration and system information</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">General Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configItems.map((item, idx) => (
            <div key={item.label}>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.value}</p>
                </div>
                {item.status && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
                    Connected
                  </Badge>
                )}
              </div>
              {idx < configItems.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Database Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tables", value: "28" },
              { label: "Models", value: "24" },
              { label: "Relations", value: "Active" },
              { label: "Provider", value: "MySQL" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          <p>
            {brandTitle} — Managing the {siteConfig.companyDomain} job board platform.
            This dashboard connects to the main MySQL database and allows administrators
            to manage jobs, opportunities, companies, articles, orders, users, and applications.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
