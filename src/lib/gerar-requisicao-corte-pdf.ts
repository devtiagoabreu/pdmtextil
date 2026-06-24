"use client"

import { toast } from "sonner"

interface RequisicaoCorteData {
  id: number
  status: string
  observacoes?: string | null
  entreguePor?: string | null
  createdAt?: string | null
  requisitanteNome?: string | null
  itens: {
    id?: number
    codigoProduto: string
    ordem: string
    artigo: string
    cor: string
    desenho: string
    quantidade: string
  }[]
}

const STATUS_LABEL: Record<string, string> = {
  SOLICITADO: "Solicitado",
  PROCESSANDO: "Processando",
  ATENDIDO: "Atendido",
}

export async function gerarRequisicaoCortePdf(data: RequisicaoCorteData) {
  let empresa: Record<string, any> | null = null
  try {
    const res = await fetch("/api/admin/config/empresa")
    const list = await res.json()
    empresa = list.find((e: any) => e.isDefault) || list[0]
  } catch {}

  function loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
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

  const { default: jsPDF } = await import("jspdf")
  await import("jspdf-autotable")

  const doc = new jsPDF("landscape")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  let y = margin

  const corPrimaria: [number, number, number] = [37, 99, 235]
  const corSecundaria: [number, number, number] = [245, 247, 250]
  const corBorda: [number, number, number] = [200, 200, 200]
  const corTexto: [number, number, number] = [51, 51, 51]
  const corTextoSec: [number, number, number] = [100, 100, 100]

  const colW = (pageWidth - margin * 2 - 16) / 3
  const cx1 = margin + 8
  const cx2 = cx1 + colW + 4
  const cx3 = cx2 + colW + 4

  // ── Header ──
  let logoImg: HTMLImageElement | null = null
  if (empresa && empresa.logoUrl) {
    try {
      logoImg = await loadImage(empresa.logoUrl)
    } catch {}
  }

  if (empresa) {
    const headerH = 48
    doc.setFillColor(...corPrimaria)
    doc.rect(0, 0, pageWidth, headerH, "F")
    doc.setTextColor(255, 255, 255)

    if (logoImg) {
      const maxW = 30
      const maxH = 30
      const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1)
      doc.addImage(logoImg, "PNG", margin, 9, logoImg.width * scale, logoImg.height * scale)
    }

    const textX = logoImg ? margin + 36 : margin + 8
    doc.setFontSize(14).setFont("helvetica", "bold")
    doc.text("REQUISIÇÃO DE CORTE", textX, 17)
    doc.setFontSize(9).setFont("helvetica", "normal")
    doc.text(empresa.nome || "", textX, 28)
    if (empresa.documento) {
      doc.setFontSize(8)
      doc.text(`CNPJ: ${empresa.documento}`, textX, 38)
    }

    // Número da requisição no canto direito
    doc.setFontSize(11).setFont("helvetica", "bold")
    doc.text(`Nº ${data.id}`, pageWidth - margin, headerH / 2, { align: "right" })

    y = headerH + 4
  } else {
    doc.setFillColor(...corPrimaria)
    doc.rect(0, 0, pageWidth, 32, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14).setFont("helvetica", "bold")
    doc.text("REQUISIÇÃO DE CORTE", pageWidth / 2, 14, { align: "center" })
    doc.setFontSize(11)
    doc.text(`Nº ${data.id}`, pageWidth / 2, 24, { align: "center" })
    y = 42
  }

  doc.setTextColor(...corTexto)

  // ── Seção Info ──
  const infoBoxH = 30
  doc.setFillColor(...corPrimaria)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9).setFont("helvetica", "bold")
  doc.text("INFORMAÇÕES", margin + 4, y + 6)

  doc.setTextColor(...corTexto)
  doc.setFillColor(...corSecundaria)
  doc.setDrawColor(...corBorda)
  doc.roundedRect(margin, y + 8, pageWidth - margin * 2, infoBoxH, 2, 2, "FD")

  const infoY = y + 8 + 7
  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Status", cx1, infoY)
  doc.text("Requisitante", cx2, infoY)
  doc.text("Data de Criação", cx3, infoY)
  doc.setFont("helvetica", "normal").setFontSize(8)
  doc.text(STATUS_LABEL[data.status] || data.status, cx1, infoY + 4)
  doc.text(data.requisitanteNome || "—", cx2, infoY + 4)
  doc.text(
    data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "—",
    cx3,
    infoY + 4
  )

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Total Itens", cx1, infoY + 11)
  doc.text("Quantidade Total", cx2, infoY + 11)
  doc.text("Entregue por", cx3, infoY + 11)
  doc.setFont("helvetica", "normal").setFontSize(8)
  doc.text(String(data.itens.length || 0), cx1, infoY + 15)
  const totalQtd = data.itens.reduce((acc, item) => {
    const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
    return acc + (isNaN(num) ? 0 : num)
  }, 0)
  doc.text(String(totalQtd), cx2, infoY + 15)
  doc.text(data.entreguePor || "—", cx3, infoY + 15)

  y = y + 8 + infoBoxH + 6

  // ── Seção Itens ──
  doc.setFillColor(...corPrimaria)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9).setFont("helvetica", "bold")
  doc.text("ITENS DE CORTE", margin + 4, y + 6)

  const tableY = y + 8
  const tableW = pageWidth - margin * 2
  const tableX = margin

  // Cabeçalho da tabela
  const headers = ["Cód. Produto", "Ordem", "Artigo", "Cor", "Desenho", "Quantidade"]
  const colWidths = [tableW * 0.18, tableW * 0.14, tableW * 0.18, tableW * 0.14, tableW * 0.18, tableW * 0.18]

  doc.setFillColor(...corPrimaria)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold").setFontSize(8)
  let hx = tableX
  headers.forEach((h, i) => {
    doc.rect(hx, tableY, colWidths[i], 7, "F")
    doc.text(h, hx + 1, tableY + 5)
    hx += colWidths[i]
  })

  // Linhas
  let rowY = tableY + 7
  doc.setTextColor(...corTexto)
  data.itens.forEach((item, i) => {
    const bgColor: [number, number, number] = i % 2 === 0 ? [255, 255, 255] : corSecundaria
    doc.setFillColor(...bgColor)

    const rowH = 7
    let rx = tableX

    const values = [
      item.codigoProduto || "—",
      item.ordem || "—",
      item.artigo || "—",
      item.cor || "—",
      item.desenho || "—",
      item.quantidade,
    ]

    values.forEach((v, vi) => {
      doc.rect(rx, rowY, colWidths[vi], rowH, "F")
      doc.setFont("helvetica", "normal").setFontSize(7)
      const fit = doc.splitTextToSize(v, colWidths[vi] - 2)
      doc.text(fit[0], rx + 1, rowY + 5)
      rx += colWidths[vi]
    })

    rowY += rowH
  })

  // Bordas da tabela
  const tableH = rowY - tableY
  doc.setDrawColor(...corBorda)
  doc.rect(tableX, tableY, tableW, tableH, "S")

  // ── Observações ──
  if (data.observacoes) {
    y = rowY + 10
    if (y > pageHeight - 30) {
      doc.addPage()
      y = margin
    }

    doc.setFillColor(...corPrimaria)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9).setFont("helvetica", "bold")
    doc.text("OBSERVAÇÕES", margin + 4, y + 6)

    doc.setTextColor(...corTexto)
    doc.setFillColor(...corSecundaria)
    doc.setDrawColor(...corBorda)
    const obsParts = doc.splitTextToSize(data.observacoes, tableW - 8)
    const obsH = Math.max(20, obsParts.length * 5 + 8)
    doc.roundedRect(margin, y + 8, tableW, obsH, 2, 2, "FD")
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(obsParts, margin + 4, y + 15)

    y = y + 8 + obsH + 6
  }

  // ── Footer ──
  if (y > pageHeight - 25) {
    doc.addPage()
    y = margin
  }
  doc.setDrawColor(...corBorda)
  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)
  doc.setTextColor(...corTextoSec)
  doc.setFontSize(7).setFont("helvetica", "normal")
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    margin,
    pageHeight - 10
  )
  doc.text("Requisição de Corte", pageWidth - margin, pageHeight - 10, { align: "right" })

  const nomeArquivo = `requisicao-corte-${data.id}.pdf`
  doc.save(nomeArquivo)
  toast.success("PDF gerado com sucesso!")
}
