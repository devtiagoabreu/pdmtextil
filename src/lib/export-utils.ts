export function exportCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        const val = cell?.toString() ?? ""
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(",")
    ),
  ].join("\n")

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function exportPDF(title: string, contentHtml: string) {
  const win = window.open("", "_blank")
  if (!win) return

  const safeTitle = escapeHtml(title)

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${safeTitle}</title>
      <style>
        @page { margin: 15mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f1f5f9; text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .stat-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; min-width: 100px; }
        .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 18px; font-weight: bold; color: #1e293b; margin-top: 2px; }
        .footer { margin-top: 24px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${safeTitle}</h1>
      <p class="subtitle">Exportado em ${new Date().toLocaleString("pt-BR")}</p>
      <div class="stats" id="pdf-stats"></div>
      <div id="pdf-content">${contentHtml}</div>
      <p class="footer">PDM PRO TÊXTIL — Relatório gerado automaticamente</p>
      <script>
        document.title = "${safeTitle.replace(/"/g, '\\"')}";
        window.onload = function() { window.print(); }
      <\/script>
    </body>
    </html>
  `)
  win.document.close()
}

export async function exportPDFRelatorio(options: {
  title: string
  stats?: Record<string, string | number>
  tables?: { headers: string[]; rows: (string | number | null | undefined)[][] }[]
  period?: string
  filename?: string
  orientation?: "portrait" | "landscape"
}) {
  const { default: jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  let empresa: { nome?: string; documento?: string; endereco?: string; cidade?: string; uf?: string; logoUrl?: string } | null = null
  try {
    const res = await fetch("/api/admin/config/empresa")
    const list: any[] = await res.json()
    empresa = list.find((e: any) => e.isDefault) || list[0] || null
  } catch {}

  const doc = new jsPDF(options.orientation || "landscape")
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginX = 14
  const marginY = 14
  const contentW = pageW - marginX * 2

  // Header bar
  doc.setFillColor(7, 63, 184)
  doc.rect(0, 0, pageW, 28, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13).setFont("helvetica", "bold")
  doc.text(empresa?.nome || "PDM PRO TÊXTIL", marginX, 11)
  doc.setFontSize(7).setFont("helvetica", "normal")
  let headerY = 17
  const headerParts: string[] = []
  if (empresa?.documento) headerParts.push(`CNPJ: ${empresa.documento}`)
  if (empresa?.endereco) headerParts.push(empresa.endereco)
  if (empresa?.cidade || empresa?.uf) headerParts.push([empresa.cidade, empresa.uf].filter(Boolean).join("/"))
  if (headerParts.length > 0) {
    doc.text(headerParts.join(" — "), marginX, headerY)
  }

  // Title
  let y = 40
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14).setFont("helvetica", "bold")
  doc.text(options.title, marginX, y)
  y += 6
  doc.setFontSize(8).setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  const periodText = options.period || `Exportado em ${new Date().toLocaleString("pt-BR")}`
  doc.text(periodText, marginX, y)
  y += 8

  // Stats
  if (options.stats) {
    const entries = Object.entries(options.stats)
    const boxW = Math.min(contentW / entries.length - 4, 80)
    for (const [label, value] of entries) {
      const x = marginX + (Object.keys(options.stats).indexOf(label) * (boxW + 4))
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(200, 200, 200)
      doc.roundedRect(x, y, boxW, 22, 2, 2, "FD")
      doc.setFontSize(6).setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)
      doc.text(label.toUpperCase(), x + 3, y + 6)
      doc.setFontSize(11).setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text(String(value), x + 3, y + 17)
    }
    y += 30
  }

  // Tables
  if (options.tables) {
    for (const table of options.tables) {
      if (table.rows.length === 0) continue

      const head = [table.headers]
      const body = table.rows.map(row => row.map(cell => cell?.toString() ?? "-"))

      ;(doc as any).autoTable({
        head,
        body,
        startY: y,
        margin: { left: marginX, right: marginX },
        tableWidth: contentW,
        styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] },
        headStyles: { fillColor: [7, 63, 184], textColor: 255, fontStyle: "bold", fontSize: 6 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {},
      })

      y = (doc as any).lastAutoTable.finalY + 8
    }
  }

  // Footer on each page
  const addFooter = (data: any) => {
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(6).setFont("helvetica", "normal")
      doc.setTextColor(80, 80, 80)
      const empresaNome = empresa?.nome || "PDM PRO TÊXTIL"
      doc.text(`${empresaNome} — Relatório gerado automaticamente`, marginX, pageH - 6)
      doc.text(`Página ${i}`, pageW - marginX, pageH - 6, { align: "right" })
    }
  }

  if (typeof (doc as any).on !== "undefined") {
    ;(doc as any).on("addPage", addFooter)
  }
  addFooter(null)

  const filename = options.filename
    ? `${options.filename}.pdf`
    : `${options.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`
  doc.save(filename)
}
