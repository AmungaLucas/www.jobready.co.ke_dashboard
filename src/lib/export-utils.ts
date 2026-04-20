export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  headers?: { key: string; label: string }[]
) {
  if (data.length === 0) return

  const keys = headers ? headers.map((h) => h.key) : Object.keys(data[0])
  const labels = headers ? headers.map((h) => h.label) : keys

  const headerRow = labels.join(",")
  const rows = data.map((row) =>
    keys.map((key) => {
      const value = String(row[key] ?? "")
      // Escape commas, quotes, and newlines per RFC 4180
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(",")
  )

  const csv = [headerRow, ...rows].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }) // BOM for Excel
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
