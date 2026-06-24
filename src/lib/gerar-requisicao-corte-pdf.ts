"use client"

import { toast } from "sonner"

export interface RequisicaoCorteData {
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

  const corHeader: [number, number, number] = [7, 63, 184]
  const corHeaderText: [number, number, number] = [255, 255, 255]
  const corPrimaria: [number, number, number] = [7, 63, 184]
  const corSecundaria: [number, number, number] = [245, 247, 250]
  const corBorda: [number, number, number] = [200, 200, 200]
  const corTexto: [number, number, number] = [51, 51, 51]
  const corTextoSec: [number, number, number] = [100, 100, 100]

  const totalQtd = data.itens.reduce((acc, item) => {
    const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
    return acc + (isNaN(num) ? 0 : num)
  }, 0)

  // ── Header ──
  let logoImg: HTMLImageElement | null = null
  if (empresa && empresa.logoUrl) {
    try {
      logoImg = await loadImage(empresa.logoUrl)
    } catch {}
  }

  function drawHeader() {
    let y = margin
    const headerH = 42

    if (empresa) {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, headerH, "F")

      if (logoImg) {
        const maxW = 26
        const maxH = 26
        const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1)
        doc.addImage(logoImg, "PNG", margin, (headerH - logoImg.height * scale) / 2, logoImg.width * scale, logoImg.height * scale)
      }

      const textX = logoImg ? margin + logoImg.width * Math.min(26 / logoImg.width, 26 / logoImg.height, 1) + 10 : margin + 8
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(13).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", textX, 14)
      doc.setFontSize(8).setFont("helvetica", "normal")
      doc.text(empresa.nome || "", textX, 23)
      if (empresa.documento) {
        doc.setFontSize(7)
        doc.text(`CNPJ: ${empresa.documento}`, textX, 32)
      }

      doc.setFontSize(12).setFont("helvetica", "bold")
      doc.setTextColor(...corHeaderText)
      doc.text(`Nº ${data.id}`, pageWidth - margin, headerH / 2, { align: "right" })

      y = headerH + 6
    } else {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, 28, "F")
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(13).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", pageWidth / 2, 12, { align: "center" })
      doc.setFontSize(11)
      doc.text(`Nº ${data.id}`, pageWidth / 2, 22, { align: "center" })
      y = 38
    }

    return y
  }

  // Draw sections
  let y = drawHeader()

  // ── Link ──
  const linkUrl = `${window.location.origin}/comercial/requisicoes-corte/${data.id}`
  doc.setTextColor(...corPrimaria)
  doc.setFontSize(8).setFont("helvetica", "normal")
  doc.textWithLink(`Abrir requisição #${data.id}`, margin, y - 2, { url: linkUrl })
  doc.setTextColor(...corTexto)
  y += 4

  // ── Info section ──
  const infoLabelY = y + 1
  doc.setFillColor(...corHeader)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
  doc.setTextColor(...corHeaderText)
  doc.setFontSize(8).setFont("helvetica", "bold")
  doc.text("INFORMAÇÕES", margin + 4, y + 5)
  y += 7 + 3

  const infoRows = [
    [
      { title: "Status", value: STATUS_LABEL[data.status] || data.status },
      { title: "Requisitante", value: data.requisitanteNome || "—" },
      { title: "Data de Criação", value: data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "—" },
    ],
    [
      { title: "Total Itens", value: String(data.itens.length || 0) },
      { title: "Quantidade Total", value: String(totalQtd) },
      { title: "Entregue por", value: data.entreguePor || "—" },
    ],
  ]

  const infoBoxH = 38
  doc.setFillColor(...corSecundaria)
  doc.setDrawColor(...corBorda)
  doc.roundedRect(margin, y, pageWidth - margin * 2, infoBoxH, 2, 2, "FD")

  const colW = (pageWidth - margin * 2 - 16) / 3
  infoRows.forEach((row, ri) => {
    const rowY = y + 4 + ri * 15
    row.forEach((cell, ci) => {
      const cx = margin + 8 + ci * (colW + 4)
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.setTextColor(...corTexto)
      doc.text(cell.title, cx, rowY)
      doc.setFont("helvetica", "normal").setFontSize(8)
      doc.text(cell.value, cx, rowY + 4)
    })
  })

  y += infoBoxH + 6

  // ── Itens table ──
  doc.setFillColor(...corHeader)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
  doc.setTextColor(...corHeaderText)
  doc.setFontSize(8).setFont("helvetica", "bold")
  doc.text("ITENS DE CORTE", margin + 4, y + 5)
  y += 7 + 3

  const tableHead = [["Cód. Produto", "Ordem", "Artigo", "Cor", "Desenho", "Quantidade"]]
  const tableBody = data.itens.map(item => [
    item.codigoProduto || "—",
    item.ordem || "—",
    item.artigo || "—",
    item.cor || "—",
    item.desenho || "—",
    item.quantidade,
  ])

  const tableW = pageWidth - margin * 2
  ;(doc as any).autoTable({
    head: tableHead,
    body: tableBody,
    startY: y,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [...corHeader], textColor: [...corHeaderText], fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [...corSecundaria] },
    margin: { left: margin, right: margin, top: 10, bottom: 16 },
    tableLineColor: [...corBorda],
    tableLineWidth: 0.5,
    columnStyles: {
      0: { cellWidth: tableW * 0.18 },
      1: { cellWidth: tableW * 0.14 },
      2: { cellWidth: tableW * 0.18 },
      3: { cellWidth: tableW * 0.14 },
      4: { cellWidth: tableW * 0.18 },
      5: { cellWidth: tableW * 0.18, halign: "center" },
    },
    didDrawPage: (data: any) => {
      doc.setDrawColor(...corBorda)
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
      doc.setTextColor(...corTextoSec)
      doc.setFontSize(7).setFont("helvetica", "normal")
      doc.text(`Requisição de Corte Nº ${data.id}`, margin, pageHeight - 7)
      doc.text(`Página ${data.pageNumber}`, pageWidth - margin, pageHeight - 7, { align: "right" })
      doc.setTextColor(...corTexto)
    },
    didDrawCell: (data: any) => {
      if (data.section === "head" && data.column.index === 0) {
        // Already styled via headStyles
      }
    },
  })

  // ── Observações ──
  const finalY = (doc as any).lastAutoTable.finalY + 6

  if (data.observacoes) {
    if (finalY > pageHeight - 40) {
      doc.addPage()
    }

    let obsY = (doc as any).lastAutoTable.finalY + 8

    doc.setFillColor(...corHeader)
    doc.roundedRect(margin, obsY, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
    doc.setTextColor(...corHeaderText)
    doc.setFontSize(8).setFont("helvetica", "bold")
    doc.text("OBSERVAÇÕES", margin + 4, obsY + 5)

    obsY += 7 + 3
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...corBorda)

    const obsParts = doc.splitTextToSize(data.observacoes, tableW - 8)
    const obsH = Math.max(20, obsParts.length * 5 + 8)

    if (obsY + obsH > pageHeight - 16) {
      doc.addPage()
      obsY = margin
    }

    doc.roundedRect(margin, obsY, tableW, obsH, 2, 2, "FD")
    doc.setTextColor(...corTexto)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(obsParts, margin + 4, obsY + 5)
  }

  // ── Footer on each page (handled by didDrawPage in autoTable) ──

  const nomeArquivo = `requisicao-corte-${data.id}.pdf`
  doc.save(nomeArquivo)
  toast.success("PDF gerado com sucesso!")
}

export async function gerarRequisicaoCortePdfConsolidado(lista: RequisicaoCorteData[]) {
  if (lista.length === 0) return

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

  const corHeader: [number, number, number] = [7, 63, 184]
  const corHeaderText: [number, number, number] = [255, 255, 255]
  const corPrimaria: [number, number, number] = [7, 63, 184]
  const corSecundaria: [number, number, number] = [245, 247, 250]
  const corBorda: [number, number, number] = [200, 200, 200]
  const corTexto: [number, number, number] = [51, 51, 51]
  const corTextoSec: [number, number, number] = [100, 100, 100]

  function drawHeader(data: RequisicaoCorteData) {
    let y = margin
    const headerH = 42

    if (empresa) {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, headerH, "F")

      if (logoImg) {
        const maxW = 26
        const maxH = 26
        const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1)
        doc.addImage(logoImg, "PNG", margin, (headerH - logoImg.height * scale) / 2, logoImg.width * scale, logoImg.height * scale)
      }

      const textX = logoImg ? margin + 26 + 10 : margin + 8
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(13).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", textX, 14)
      doc.setFontSize(8).setFont("helvetica", "normal")
      doc.text(empresa.nome || "", textX, 23)
      if (empresa.documento) {
        doc.setFontSize(7)
        doc.text(`CNPJ: ${empresa.documento}`, textX, 32)
      }

      doc.setFontSize(12).setFont("helvetica", "bold")
      doc.setTextColor(...corHeaderText)
      doc.text(`Nº ${data.id}`, pageWidth - margin, headerH / 2, { align: "right" })

      y = headerH + 6
    } else {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, 28, "F")
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(13).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", pageWidth / 2, 12, { align: "center" })
      doc.setFontSize(11)
      doc.text(`Nº ${data.id}`, pageWidth / 2, 22, { align: "center" })
      y = 38
    }

    return y
  }

  let logoImg: HTMLImageElement | null = null
  if (empresa && empresa.logoUrl) {
    try {
      logoImg = await loadImage(empresa.logoUrl)
    } catch {}
  }

  const totalGeralQtd = lista.reduce((acc, r) => {
    return acc + r.itens.reduce((s, item) => {
      const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
      return s + (isNaN(num) ? 0 : num)
    }, 0)
  }, 0)

  const totalGeralItens = lista.reduce((acc, r) => acc + r.itens.length, 0)

  for (let i = 0; i < lista.length; i++) {
    const data = lista[i]
    if (i > 0) doc.addPage()

    let y = drawHeader(data)

    // Link
    const linkUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/comercial/requisicoes-corte/${data.id}`
    doc.setTextColor(...corPrimaria)
    doc.setFontSize(8).setFont("helvetica", "normal")
    doc.textWithLink(`Abrir requisição #${data.id}`, margin, y - 2, { url: linkUrl })
    doc.setTextColor(...corTexto)
    y += 4

    // Info
    const totalQtd = data.itens.reduce((acc, item) => {
      const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
      return acc + (isNaN(num) ? 0 : num)
    }, 0)

    doc.setFillColor(...corHeader)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
    doc.setTextColor(...corHeaderText)
    doc.setFontSize(8).setFont("helvetica", "bold")
    doc.text("INFORMAÇÕES", margin + 4, y + 5)
    y += 7 + 3

    const infoBoxH = 38
    doc.setFillColor(...corSecundaria)
    doc.setDrawColor(...corBorda)
    doc.roundedRect(margin, y, pageWidth - margin * 2, infoBoxH, 2, 2, "FD")

    const colW = (pageWidth - margin * 2 - 16) / 3
    const infoData = [
      [
        { title: "Status", value: STATUS_LABEL[data.status] || data.status },
        { title: "Requisitante", value: data.requisitanteNome || "—" },
        { title: "Data de Criação", value: data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "—" },
      ],
      [
        { title: "Total Itens", value: String(data.itens.length || 0) },
        { title: "Quantidade Total", value: String(totalQtd) },
        { title: "Entregue por", value: data.entreguePor || "—" },
      ],
    ]

    infoData.forEach((row, ri) => {
      const rowY = y + 4 + ri * 15
      row.forEach((cell, ci) => {
        const cx = margin + 8 + ci * (colW + 4)
        doc.setFont("helvetica", "bold").setFontSize(7)
        doc.setTextColor(...corTexto)
        doc.text(cell.title, cx, rowY)
        doc.setFont("helvetica", "normal").setFontSize(8)
        doc.text(cell.value, cx, rowY + 4)
      })
    })

    y += infoBoxH + 6

    // Itens table
    doc.setFillColor(...corHeader)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
    doc.setTextColor(...corHeaderText)
    doc.setFontSize(8).setFont("helvetica", "bold")
    doc.text("ITENS DE CORTE", margin + 4, y + 5)
    y += 7 + 3

    const tableHead = [["Cód. Produto", "Ordem", "Artigo", "Cor", "Desenho", "Quantidade"]]
    const tableBody = data.itens.map(item => [
      item.codigoProduto || "—",
      item.ordem || "—",
      item.artigo || "—",
      item.cor || "—",
      item.desenho || "—",
      item.quantidade,
    ])

    const tableW = pageWidth - margin * 2
    ;(doc as any).autoTable({
      head: tableHead,
      body: tableBody,
      startY: y,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [...corHeader], textColor: [...corHeaderText], fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [...corSecundaria] },
      margin: { left: margin, right: margin, top: 10, bottom: 16 },
      tableLineColor: [...corBorda],
      tableLineWidth: 0.5,
      columnStyles: {
        0: { cellWidth: tableW * 0.18 },
        1: { cellWidth: tableW * 0.14 },
        2: { cellWidth: tableW * 0.18 },
        3: { cellWidth: tableW * 0.14 },
        4: { cellWidth: tableW * 0.18 },
        5: { cellWidth: tableW * 0.18, halign: "center" },
      },
      didDrawPage: (data: any) => {
        doc.setDrawColor(...corBorda)
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
        doc.setTextColor(...corTextoSec)
        doc.setFontSize(7).setFont("helvetica", "normal")
        doc.text(`Requisição de Corte Nº ${data.id}`, margin, pageHeight - 7)
        doc.text(`Página ${data.pageNumber}`, pageWidth - margin, pageHeight - 7, { align: "right" })
        doc.setTextColor(...corTexto)
      },
    })

    // Observações
    const finalY = (doc as any).lastAutoTable.finalY + 6
    if (data.observacoes) {
      let obsY = (doc as any).lastAutoTable.finalY + 8
      if (obsY > pageHeight - 40) {
        doc.addPage()
        obsY = margin
      }

      doc.setFillColor(...corHeader)
      doc.roundedRect(margin, obsY, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(8).setFont("helvetica", "bold")
      doc.text("OBSERVAÇÕES", margin + 4, obsY + 5)
      obsY += 7 + 3

      const obsParts = doc.splitTextToSize(data.observacoes, tableW - 8)
      const obsH = Math.max(20, obsParts.length * 5 + 8)
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(...corBorda)
      doc.roundedRect(margin, obsY, tableW, obsH, 2, 2, "FD")
      doc.setTextColor(...corTexto)
      doc.setFont("helvetica", "normal").setFontSize(8)
      doc.text(obsParts, margin + 4, obsY + 5)
    }
  }

  const sufixo = lista.length <= 3 ? lista.map(r => r.id).join("-") : `${lista[0].id}-${lista[lista.length - 1].id}`
  doc.save(`requisicoes-corte-${sufixo}.pdf`)
  toast.success(`PDF consolidado com ${lista.length} requisição(ões) gerado!`)
}
