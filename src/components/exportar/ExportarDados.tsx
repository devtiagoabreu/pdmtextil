"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, FileJson, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ExportColumn {
  key: string
  label: string
}

interface EmpresaLogo {
  nome: string
  documento?: string
  endereco?: string
  cidade?: string
  uf?: string
  telefone?: string
  email?: string
  logoUrl?: string
}

interface Props {
  data: Record<string, any>[]
  columns: ExportColumn[]
  filename: string
  title?: string
}

export function ExportarDados({ data, columns, filename, title }: Props) {
  const [exporting, setExporting] = useState(false)

  function toCSV() {
    const header = columns.map(c => `"${c.label}"`).join(",")
    const rows = data.map(row =>
      columns.map(c => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    )
    const csv = [header, ...rows].join("\n")
    const bom = "\uFEFF"
    download(bom + csv, `${filename}.csv`, "text/csv;charset=utf-8;")
    toast.success("CSV exportado")
  }

  function toJSON() {
    const rows = data.map(row => {
      const obj: Record<string, any> = {}
      columns.forEach(c => { obj[c.label] = row[c.key] ?? "" })
      return obj
    })
    download(JSON.stringify(rows, null, 2), `${filename}.json`, "application/json")
    toast.success("JSON exportado")
  }

  async function toPDF() {
    setExporting(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      let empresa: EmpresaLogo | null = null
      try {
        const res = await fetch("/api/admin/config/empresa")
        const list: EmpresaLogo[] = await res.json()
        empresa = list.find(e => (e as any).isDefault) || list[0]
      } catch {}

      const doc = new jsPDF("landscape")

      if (empresa) {
        if (empresa.logoUrl) {
          try {
            const img = await loadImage(empresa.logoUrl)
            if (img) {
              const maxW = 40; const maxH = 20
              const scale = Math.min(maxW / img.width, maxH / img.height, 1)
              const w = img.width * scale; const h = img.height * scale
              doc.addImage(img, "PNG", 10, 8, w, h)
            }
          } catch {}
        }
        doc.setFontSize(12).setFont("helvetica", "bold")
        doc.text(empresa.nome || "", 55, 14)
        doc.setFontSize(8).setFont("helvetica", "normal")
        let yOff = 20
        if (empresa.documento) { doc.text(`CNPJ: ${empresa.documento}`, 55, yOff); yOff += 5 }
        if (empresa.endereco) { doc.text(empresa.endereco, 55, yOff); yOff += 5 }
        if (empresa.cidade || empresa.uf) { doc.text([empresa.cidade, empresa.uf].filter(Boolean).join("/"), 55, yOff); yOff += 5 }
        if (empresa.telefone) { doc.text(`Tel: ${empresa.telefone}`, 55, yOff) }
      }

      const displayTitle = title || filename
      doc.setFontSize(14).setFont("helvetica", "bold")
      const titleY = empresa ? 40 : 15
      doc.text(displayTitle, 10, titleY)

      const head = [columns.map(c => c.label)]
      const body = data.map(row => columns.map(c => String(row[c.key] ?? "")))

      ;(doc as any).autoTable({
        head,
        body,
        startY: titleY + 6,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [7, 63, 184], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 10 },
      })

      doc.save(`${filename}.pdf`)
      toast.success("PDF exportado")
    } catch (err) {
      toast.error("Erro ao gerar PDF: " + (err instanceof Error ? err.message : "desconhecido"))
    } finally { setExporting(false) }
  }

  function download(content: string | Blob, name: string, mime: string) {
    const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  function loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise(resolve => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => {
        const proxy = `/api/proxy-image?url=${encodeURIComponent(url)}`
        const img2 = new Image()
        img2.crossOrigin = "anonymous"
        img2.onload = () => resolve(img2)
        img2.onerror = () => resolve(null)
        img2.src = proxy
      }
      img.src = url
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="outline" onClick={toCSV} className="gap-1.5 text-xs h-8">
        <FileDown size={14} /> CSV
      </Button>
      <Button size="sm" variant="outline" onClick={toJSON} className="gap-1.5 text-xs h-8">
        <FileJson size={14} /> JSON
      </Button>
      <Button size="sm" variant="outline" onClick={toPDF} disabled={exporting} className="gap-1.5 text-xs h-8">
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        PDF
      </Button>
    </div>
  )
}
