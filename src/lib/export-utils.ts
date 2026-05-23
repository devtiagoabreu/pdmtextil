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

export function exportPDF(title: string, contentHtml: string) {
  const win = window.open("", "_blank")
  if (!win) return

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
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
      <h1>${title}</h1>
      <p class="subtitle">Exportado em ${new Date().toLocaleString("pt-BR")}</p>
      <div class="stats" id="pdf-stats"></div>
      <div id="pdf-content">${contentHtml}</div>
      <p class="footer">PDM PRO TÊXTIL — Relatório gerado automaticamente</p>
      <script>
        document.title = "${title.replace(/"/g, '\\"')}";
        window.onload = function() { window.print(); }
      <\/script>
    </body>
    </html>
  `)
  win.document.close()
}

export function statsToHTML(stats: Record<string, string | number>): string {
  return Object.entries(stats)
    .map(
      ([label, value]) =>
        `<div class="stat-box"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`
    )
    .join("")
}

export function tableToHTML(headers: string[], rows: (string | number | null | undefined)[][]): string {
  if (rows.length === 0) return "<p style='color:#94a3b8;font-style:italic;'>Nenhum dado disponível</p>"
  return `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${cell?.toString() ?? "-"}</td>`).join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `
}
