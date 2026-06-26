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

export async function exportPDFRelatorio(title: string, contentHtml: string, period?: string) {
  let empresa: { nome?: string; documento?: string; endereco?: string; cidade?: string; uf?: string; logoUrl?: string } | null = null
  try {
    const res = await fetch("/api/admin/config/empresa")
    const list: any[] = await res.json()
    empresa = list.find((e: any) => e.isDefault) || list[0] || null
  } catch {}

  const win = window.open("", "_blank")
  if (!win) return

  const safeTitle = escapeHtml(title)
  const empresaNome = escapeHtml(empresa?.nome || "PDM PRO TÊXTIL")
  const empresaDoc = empresa?.documento ? `CNPJ: ${escapeHtml(empresa.documento)}` : ""
  const empresaEnd = [empresa?.endereco, [empresa?.cidade, empresa?.uf].filter(Boolean).join("/")].filter(Boolean).join(" — ")
  const periodText = period ? escapeHtml(period) : `Exportado em ${new Date().toLocaleString("pt-BR")}`

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${safeTitle}</title>
      <style>
        @page { margin: 8mm 12mm; }
        @page :first { margin-top: 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; }
        .header-bar { background: #073fb8; color: #fff; padding: 14px 20px; display: flex; align-items: center; gap: 16px; }
        .header-bar .empresa-info { flex: 1; }
        .header-bar .empresa-nome { font-size: 16px; font-weight: bold; }
        .header-bar .empresa-detalhes { font-size: 9px; opacity: 0.85; margin-top: 2px; }
        .header-bar .logo { max-height: 36px; max-width: 120px; }
        .title-section { padding: 16px 20px 6px; border-bottom: 2px solid #073fb8; margin-bottom: 16px; }
        .title-section h1 { font-size: 18px; color: #073fb8; }
        .title-section .period { font-size: 11px; color: #64748b; margin-top: 2px; }
        .stats { display: flex; gap: 12px; flex-wrap: wrap; padding: 0 20px 14px; }
        .stat-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; min-width: 110px; flex: 1; }
        .stat-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 20px; font-weight: bold; color: #073fb8; margin-top: 1px; }
        .content { padding: 0 20px 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #073fb8; color: #fff; text-align: left; padding: 7px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #334155; }
        tr:nth-child(even) td { background: #f8fafc; }
        a { color: #2563eb; text-decoration: underline; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding: 6px 20px; background: #fff; }
        .section-title { font-size: 13px; font-weight: bold; color: #073fb8; margin: 18px 0 4px; padding: 0 20px; }
        @media print { body { padding: 0; } .footer { position: fixed; } }
      </style>
    </head>
    <body>
      <div class="header-bar">
        <div class="empresa-info">
          <div class="empresa-nome">${empresaNome}</div>
          <div class="empresa-detalhes">${empresaDoc}${empresaDoc && empresaEnd ? " — " : ""}${empresaEnd}</div>
        </div>
      </div>
      <div class="title-section">
        <h1>${safeTitle}</h1>
        <div class="period">${periodText}</div>
      </div>
      <div class="stats" id="pdf-stats"></div>
      <div id="pdf-content" class="content">${contentHtml}</div>
      <div class="footer">${empresaNome} — Relatório gerado automaticamente</div>
      <script>
        document.title = "${safeTitle.replace(/"/g, '\\"')}";
        var pageNum = 1;
        var footer = document.querySelector('.footer');
        if (footer) {
          var origText = footer.textContent;
          footer.textContent = origText + ' — Página ' + pageNum;
        }
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
