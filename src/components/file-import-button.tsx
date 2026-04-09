"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileImportButtonProps {
  onDataExtracted: (data: Record<string, unknown>) => void
  variant?: "outline" | "default" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

// ---------------------------------------------------------------------------
// Known keys we want to extract from JSON
// ---------------------------------------------------------------------------

const KNOWN_KEYS = new Set([
  "title",
  "description",
  "shortDescription",
  "excerpt",
  "howToApply",
  "tags",
  "categories",
  "industry",
  "employmentType",
  "experienceLevel",
  "country",
  "county",
  "town",
  "salaryMin",
  "salaryMax",
  "salaryCurrency",
  "salaryPeriod",
  "opportunityType",
  "deadline",
  "organizationType",
  "size",
  "website",
  "contactEmail",
  "phoneNumber",
  "metaTitle",
  "metaDescription",
  "name",
  "logo",
  "featuredImage",
])

// ---------------------------------------------------------------------------
// Shared text-parsing helper (used by MD, DOCX and PDF)
// ---------------------------------------------------------------------------

function extractStructuredData(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean)

  if (nonEmpty.length === 0) return result

  // ---- 1. Find title ----
  // First try an explicit markdown heading
  const headingIdx = nonEmpty.findIndex((l) => /^#{1,6}\s/.test(l))
  if (headingIdx !== -1) {
    result.title = nonEmpty[headingIdx].replace(/^#{1,6}\s+/, "").trim()
  } else {
    // For plain text (DOCX/PDF): first short line that looks like a heading
    const candidate = nonEmpty.find((l) => l.length <= 120 && l.length > 2)
    if (candidate) result.title = candidate
  }

  // ---- 2. Determine the body (everything after the title) ----
  const titleLine = result.title
  let bodyStartIdx = nonEmpty.findIndex((l) => l === String(titleLine))
  if (bodyStartIdx === -1) bodyStartIdx = 0
  else bodyStartIdx += 1

  const bodyLines = nonEmpty.slice(bodyStartIdx)

  // ---- 3. First paragraph → shortDescription / excerpt ----
  const firstParagraph = bodyLines.find((l) => l.length > 10)
  if (firstParagraph) {
    result.shortDescription = firstParagraph
    result.excerpt = firstParagraph
  }

  // ---- 4. Full description → everything after the first paragraph (trimmed) ----
  const descStart = bodyLines.findIndex((l) => l === firstParagraph)
  const descLines = descStart !== -1 ? bodyLines.slice(descStart) : bodyLines
  const fullDesc = descLines.join("\n\n").trim()
  if (fullDesc) result.description = fullDesc

  // ---- 5. Extract key-value pairs ----
  // Patterns: "Key: Value", "**Key:** Value", "Key | Value"
  const kvPatterns: [RegExp, (key: string) => string | null][] = [
    [/^\*{0,2}(Industry)\s*[:|：]\*{0,2}\s*(.+)$/i, (k) => k.toLowerCase()],
    [/^\*{0,2}(Employment\s*Type)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "employmentType"],
    [/^\*{0,2}(Opportunity\s*Type)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "opportunityType"],
    [/^\*{0,2}(Type)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "opportunityType"],
    [/^\*{0,2}(Experience\s*Level)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "experienceLevel"],
    [/^\*{0,2}(Location)\s*[:|：]\*{0,2}\s*(.+)$/i, () => null],
    [/^\*{0,2}(County)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "county"],
    [/^\*{0,2}(Town)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "town"],
    [/^\*{0,2}(Country)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "country"],
    [/^\*{0,2}(Deadline)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "deadline"],
    [/^\*{0,2}(How\s*to\s*Apply)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "howToApply"],
    [/^\*{0,2}(Website)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "website"],
    [/^\*{0,2}(Email|Contact\s*Email)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "contactEmail"],
    [/^\*{0,2}(Phone|Phone\s*Number)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "phoneNumber"],
    [/^\*{0,2}(Salary)\s*[:|：]\*{0,2}\s*(.+)$/i, () => null],
    [/^\*{0,2}(Organization\s*Type)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "organizationType"],
    [/^\*{0,2}(Company|Organization)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "name"],
    [/^\*{0,2}(Categories)\s*[:|：]\*{0,2}\s*(.+)$/i, () => "categories"],
  ]

  for (const line of bodyLines) {
    for (const [pattern, keyMapper] of kvPatterns) {
      const match = line.match(pattern)
      if (!match) continue
      const rawKey = match[1]
      const rawVal = match[2].replace(/\*{2}/g, "").trim()
      const mappedKey = keyMapper(rawKey)

      if (mappedKey === null) {
        // Special handling
        if (/location/i.test(rawKey)) {
          // Try to parse "County, Town" or "Town, County"
          const parts = rawVal.split(/[,\s]+/)
          if (parts.length >= 2) {
            // Assume longer word might be county/town — heuristics
            result.county = parts[0].trim()
            result.town = parts.slice(1).join(" ").trim()
          } else {
            result.town = rawVal
          }
        }
        if (/salary/i.test(rawKey)) {
          // Try to extract salary numbers
          const numMatch = rawVal.match(/([\d,]+)/g)
          if (numMatch && numMatch.length >= 2) {
            result.salaryMin = Number(numMatch[0].replace(/,/g, ""))
            result.salaryMax = Number(numMatch[1].replace(/,/g, ""))
          } else if (numMatch && numMatch.length === 1) {
            result.salaryMax = Number(numMatch[0].replace(/,/g, ""))
          }
        }
        continue
      }

      if (mappedKey && rawVal) {
        result[mappedKey] = rawVal
      }
      break // only match one pattern per line
    }
  }

  // ---- 6. Tags (lines starting with - or *) ----
  const tagLines: string[] = []
  for (const line of bodyLines) {
    const tagMatch = line.match(/^[-*]\s+(.+)/)
    if (tagMatch) {
      const tag = tagMatch[1].replace(/\*{2}/g, "").trim()
      if (tag) tagLines.push(tag)
    }
  }
  if (tagLines.length > 0) {
    result.tags = tagLines.join(", ")
  }

  return result
}

// ---------------------------------------------------------------------------
// File parsers
// ---------------------------------------------------------------------------

function parseJsonFile(file: File): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string)

        // If it's an array, take the first item
        const data = Array.isArray(raw) ? raw[0] : raw

        if (!data || typeof data !== "object") {
          reject(new Error("JSON did not contain a valid object"))
          return
        }

        // Only keep known keys
        const result: Record<string, unknown> = {}
        for (const key of Object.keys(data)) {
          if (KNOWN_KEYS.has(key)) {
            result[key] = data[key]
          }
        }
        resolve(result)
      } catch {
        reject(new Error("Invalid JSON file"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

function parseMarkdownFile(file: File): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        resolve(extractStructuredData(text))
      } catch {
        reject(new Error("Failed to parse Markdown file"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

async function parseDocxFile(file: File): Promise<Record<string, unknown>> {
  const { extractRawText } = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  const result = await extractRawText({ arrayBuffer })
  return extractStructuredData(result.value)
}

async function parsePdfFile(file: File): Promise<Record<string, unknown>> {
  const pdfjsLib = await import("pdfjs-dist")

  // Set up the worker — use CDN for the correct installed major version
  const pdfjsVersion = (pdfjsLib as unknown as { version?: string }).version || "5.6.205"
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
    textParts.push(pageText)
  }

  return extractStructuredData(textParts.join("\n"))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FileImportButton({
  onDataExtracted,
  variant = "outline",
  size = "default",
  className,
}: FileImportButtonProps) {
  const [loading, setLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-imported
    e.target.value = ""

    setLoading(true)
    try {
      let data: Record<string, unknown>

      const ext = file.name.split(".").pop()?.toLowerCase()
      switch (ext) {
        case "json":
          data = await parseJsonFile(file)
          break
        case "md":
          data = await parseMarkdownFile(file)
          break
        case "docx":
          data = await parseDocxFile(file)
          break
        case "pdf":
          data = await parsePdfFile(file)
          break
        default:
          throw new Error(`Unsupported file format: .${ext}`)
      }

      const fieldCount = Object.keys(data).length
      if (fieldCount === 0) {
        toast.warning("No recognised fields found in the file")
        return
      }

      onDataExtracted(data)
      toast.success(`File imported successfully — ${fieldCount} field${fieldCount !== 1 ? "s" : ""} populated`)
    } catch (err) {
      console.error("FileImportButton error:", err)
      toast.error("Failed to parse file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        Import File
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".json,.docx,.pdf,.md"
        className="hidden"
        onChange={handleChange}
      />

      <p className="mt-1.5 text-xs text-muted-foreground">
        JSON, DOCX, PDF, or MD
      </p>
    </div>
  )
}
