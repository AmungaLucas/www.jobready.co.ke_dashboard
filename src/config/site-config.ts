/**
 * Site Configuration
 *
 * All branding values are driven by NEXT_PUBLIC_ environment variables
 * so that a single env change flips every reference across the dashboard.
 */

export const siteConfig = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || "JobReady",
  companyDomain: process.env.NEXT_PUBLIC_COMPANY_DOMAIN || "jobready.co.ke",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.jobnet.co.ke",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "254786090635",
} as const

/**
 * Derived helpers
 */
export const brandInitials = siteConfig.brandName
  .split(/\s+/)
  .map((w) => w[0])
  .join("")
  .toUpperCase()
  .slice(0, 2)

export const brandTitle = `${siteConfig.brandName} Admin Dashboard`

export const brandDescription = `Admin dashboard for ${siteConfig.companyDomain} - Kenya's leading job board platform`
