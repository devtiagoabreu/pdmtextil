"use client"

import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Location {
  id: number
  latitude: number
  longitude: number
  endereco: string | null
  observacao: string | null
  tipo: string
  createdAt: string | null
}

interface Visita {
  id: number
  empresaNome: string | null
  clienteNome: string | null
  oportunidadeTitulo: string | null
  contatoNome: string | null
  dataVisita: string | null
  hora: string | null
  tipo: string
  status: string
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  relato: string | null
  fotos: string[] | null
  criadoPorNome: string | null
  checkInTime: string | null
  checkOutTime: string | null
  checkInLat: number | null
  checkInLng: number | null
  checkOutLat: number | null
  checkOutLng: number | null
}

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Video",
  TELEFONE: "Telefone",
}

export default function VisitReportButton({ visita }: { visita: Visita }) {
  const [generating, setGenerating] = useState(false)

  async function generateReport() {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      let empresa: any = null
      try {
        const res = await fetch("/api/admin/config/empresa")
        const list: any[] = await res.json()
        empresa = list.find((e: any) => e.isDefault) || list[0] || null
      } catch {}

      let locations: Location[] = []
      try {
        const res = await fetch(`/api/crm/visitas/${visita.id}/localizacoes`)
        if (res.ok) locations = await res.json()
      } catch {}

      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const marginX = 14
      const contentW = pageW - marginX * 2

      doc.setFillColor(7, 63, 184)
      doc.rect(0, 0, pageW, 28, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(13).setFont("helvetica", "bold")
      doc.text(empresa?.nome || "PDM PRO TEXTIL", marginX, 11)
      doc.setFontSize(7).setFont("helvetica", "normal")
      const headerParts: string[] = []
      if (empresa?.documento) headerParts.push(`CNPJ: ${empresa.documento}`)
      if (empresa?.endereco) headerParts.push(empresa.endereco)
      if (empresa?.cidade || empresa?.uf) headerParts.push([empresa.cidade, empresa.uf].filter(Boolean).join("/"))
      if (headerParts.length > 0) {
        doc.text(headerParts.join(" — "), marginX, 17)
      }

      let y = 40
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16).setFont("helvetica", "bold")
      doc.text(`Relatorio de Visita #${visita.id}`, marginX, y)
      y += 8
      doc.setFontSize(9).setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, marginX, y)
      y += 12

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(200, 200, 200)
      doc.roundedRect(marginX, y, contentW, 50, 2, 2, "FD")

      let ly = y + 8
      const col1X = marginX + 4
      const col2X = marginX + contentW / 2 + 4

      doc.setFontSize(8).setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("Pessoa:", col1X, ly)
      doc.setFont("helvetica", "normal")
      doc.text(visita.empresaNome || visita.clienteNome || "—", col1X + 18, ly)
      doc.setFont("helvetica", "bold")
      doc.text("Status:", col2X, ly)
      doc.setFont("helvetica", "normal")
      doc.text(visita.status, col2X + 15, ly)
      ly += 7

      doc.setFont("helvetica", "bold")
      doc.text("Data:", col1X, ly)
      doc.setFont("helvetica", "normal")
      doc.text(visita.dataVisita ? `${new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")}${visita.hora ? ` às ${visita.hora}` : ""}` : "—", col1X + 12, ly)
      doc.setFont("helvetica", "bold")
      doc.text("Tipo:", col2X, ly)
      doc.setFont("helvetica", "normal")
      doc.text(TIPO_LABELS[visita.tipo] || visita.tipo, col2X + 12, ly)
      ly += 7

      if (visita.oportunidadeTitulo) {
        doc.setFont("helvetica", "bold")
        doc.text("Oportunidade:", col1X, ly)
        doc.setFont("helvetica", "normal")
        doc.text(visita.oportunidadeTitulo, col1X + 30, ly)
        ly += 7
      }

      if (visita.contatoNome) {
        doc.setFont("helvetica", "bold")
        doc.text("Contato:", col1X, ly)
        doc.setFont("helvetica", "normal")
        doc.text(visita.contatoNome, col1X + 20, ly)
        ly += 7
      }

      if (visita.criadoPorNome) {
        doc.setFont("helvetica", "bold")
        doc.text("Representante:", col1X, ly)
        doc.setFont("helvetica", "normal")
        doc.text(visita.criadoPorNome, col1X + 30, ly)
        ly += 7
      }

      y += 58

      if (visita.endereco || visita.cidade) {
        doc.setFontSize(10).setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Endereco", marginX, y)
        y += 6
        doc.setFontSize(8).setFont("helvetica", "normal")
        const enderecoParts = [
          visita.endereco,
          visita.numero,
          visita.complemento,
          visita.bairro,
          [visita.cidade, visita.uf].filter(Boolean).join("/"),
        ].filter(Boolean)
        if (enderecoParts.length > 0) {
          doc.text(enderecoParts.join(", "), marginX, y)
          y += 7
        }
        y += 4
      }

      if (visita.checkInTime || visita.checkOutTime) {
        doc.setFontSize(10).setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Check-in / Check-out", marginX, y)
        y += 6
        doc.setFontSize(8).setFont("helvetica", "normal")

        if (visita.checkInTime) {
          const checkInStr = new Date(visita.checkInTime).toLocaleString("pt-BR")
          doc.setFont("helvetica", "bold")
          doc.text("Check-in:", marginX, y)
          doc.setFont("helvetica", "normal")
          doc.text(checkInStr, marginX + 20, y)
          if (visita.checkInLat && visita.checkInLng) {
            doc.text(`(${visita.checkInLat.toFixed(6)}, ${visita.checkInLng.toFixed(6)})`, marginX + 80, y)
          }
          y += 6
        }

        if (visita.checkOutTime) {
          const checkOutStr = new Date(visita.checkOutTime).toLocaleString("pt-BR")
          doc.setFont("helvetica", "bold")
          doc.text("Check-out:", marginX, y)
          doc.setFont("helvetica", "normal")
          doc.text(checkOutStr, marginX + 22, y)
          if (visita.checkOutLat && visita.checkOutLng) {
            doc.text(`(${visita.checkOutLat.toFixed(6)}, ${visita.checkOutLng.toFixed(6)})`, marginX + 80, y)
          }
          y += 6
        }

        y += 4
      }

      if (locations.length > 0) {
        doc.setFontSize(10).setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(`Localizacoes (${locations.length})`, marginX, y)
        y += 6

        const locRows = locations.map((loc) => [
          loc.createdAt ? new Date(loc.createdAt).toLocaleString("pt-BR") : "—",
          `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
          loc.observacao || "—",
          `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`,
        ])

        ;(doc as any).autoTable({
          head: [["Data/Hora", "Coordenadas", "Observacao", "Link Maps"]],
          body: locRows,
          startY: y,
          margin: { left: marginX, right: marginX },
          tableWidth: contentW,
          styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] },
          headStyles: { fillColor: [7, 63, 184], textColor: 255, fontStyle: "bold", fontSize: 6 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            3: { textColor: [59, 130, 246], fontStyle: "normal" },
          },
        })

        y = (doc as any).lastAutoTable.finalY + 8
      }

      if (visita.relato) {
        if (y > pageH - 60) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(10).setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Relato / Ata", marginX, y)
        y += 6

        const cleanRelato = visita.relato
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim()

        doc.setFontSize(8).setFont("helvetica", "normal")
        const splitRelato = doc.splitTextToSize(cleanRelato, contentW)
        doc.text(splitRelato, marginX, y)
        y += splitRelato.length * 4 + 8
      }

      if (visita.fotos && visita.fotos.length > 0) {
        if (y > pageH - 60) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(10).setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(`Fotos (${visita.fotos.length})`, marginX, y)
        y += 6

        doc.setFontSize(7).setFont("helvetica", "normal")
        doc.setTextColor(59, 130, 246)
        for (const foto of visita.fotos) {
          if (y > pageH - 20) {
            doc.addPage()
            y = 20
          }
          doc.text(foto, marginX, y)
          y += 4
        }
        doc.setTextColor(0, 0, 0)
        y += 4
      }

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(6).setFont("helvetica", "normal")
        doc.setTextColor(80, 80, 80)
        const empresaNome = empresa?.nome || "PDM PRO TEXTIL"
        doc.text(`${empresaNome} — Relatorio gerado automaticamente`, marginX, pageH - 6)
        doc.text(`Pagina ${i}/${pageCount}`, pageW - marginX, pageH - 6, { align: "right" })
      }

      doc.save(`relatorio-visita-${visita.id}.pdf`)
      toast.success("Relatorio gerado com sucesso")
    } catch (error) {
      console.error("[VisitReport]", error)
      toast.error("Erro ao gerar relatorio")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={generateReport}
      disabled={generating}
      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {generating ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileText size={14} />
      )}
      {generating ? "Gerando..." : "Gerar Relatorio"}
    </button>
  )
}
