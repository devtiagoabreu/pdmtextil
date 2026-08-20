"use client"

import { toast } from "sonner"

export interface RequisicaoCorteData {
  id: number
  status: string
  observacoes?: string | null
  entreguePor?: string | null
  dataSolicitacao?: string | null
  dataEntrega?: string | null
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

export async function gerarRequisicaoCortePdf(data: RequisicaoCorteData, orientation: "portrait" | "landscape" = "portrait") {
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

  const doc = new jsPDF(orientation === "landscape" ? "landscape" : "portrait")
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

  const totalQtd = data.itens.reduce((acc: any, item: any) => {
    const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
    return acc + (isNaN(num) ? 0 : num)
  }, 0)

  function agruparItens(itens: RequisicaoCorteData["itens"]) {
    const mapa = new Map<string, { item: RequisicaoCorteData["itens"][0]; qtd: string; qtdNum: number }>()
    for (const item of itens) {
      const chave = [item.codigoProduto, item.ordem, item.artigo, item.cor, item.desenho].join("||")
      const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
      const existente = mapa.get(chave)
      if (existente) {
        existente.qtd += " + " + item.quantidade
        existente.qtdNum += isNaN(num) ? 0 : num
      } else {
        mapa.set(chave, { item, qtd: item.quantidade, qtdNum: isNaN(num) ? 0 : num })
      }
    }
    return Array.from(mapa.values())
  }

  const itensAgrupados = agruparItens(data.itens)

  // ── Header ──
  let logoImg: HTMLImageElement | null = null
  if (empresa && empresa.logoUrl) {
    try {
      logoImg = await loadImage(empresa.logoUrl)
    } catch {}
  }

  function drawHeader() {
    let y = margin
    const headerH = 28

    if (empresa) {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, headerH, "F")

      if (logoImg) {
        const maxW = 18
        const maxH = 18
        const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1)
        doc.addImage(logoImg, "PNG", margin, (headerH - logoImg.height * scale) / 2, logoImg.width * scale, logoImg.height * scale)
      }

      const textX = logoImg ? margin + 18 + 8 : margin + 6
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(11).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", textX, 11)
      doc.setFontSize(7).setFont("helvetica", "normal")
      doc.text(empresa.nome || "", textX, 18)
      if (empresa.documento) {
        doc.setFontSize(6.5)
        doc.text(`CNPJ: ${empresa.documento}`, textX, 24)
      }

      doc.setFontSize(11).setFont("helvetica", "bold")
      doc.setTextColor(...corHeaderText)
      doc.text(`Nº ${data.id}`, pageWidth - margin, headerH / 2, { align: "right" })

      y = headerH + 5
    } else {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, 22, "F")
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(11).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", pageWidth / 2, 9, { align: "center" })
      doc.setFontSize(9)
      doc.text(`Nº ${data.id}`, pageWidth / 2, 17, { align: "center" })
      y = 30
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
      { title: "Data Solicitação", value: data.dataSolicitacao ? new Date(data.dataSolicitacao + "T12:00:00").toLocaleDateString("pt-BR") : "—" },
      { title: "Data Entrega", value: data.dataEntrega ? new Date(data.dataEntrega + "T12:00:00").toLocaleDateString("pt-BR") : "—" },
      { title: "Entregue por", value: data.entreguePor || "—" },
    ],
    [
      { title: "Total Itens", value: String(data.itens.length || 0) },
      { title: "Quantidade Total", value: String(totalQtd) },
      { title: "", value: "" },
    ],
  ]

  const colW = (pageWidth - margin * 2 - 16) / 3
  const infoRowsH = 45
  const obsParts = data.observacoes ? doc.splitTextToSize(data.observacoes, pageWidth - margin * 2 - 16) : []
  const obsBlockH = data.observacoes ? Math.max(14, obsParts.length * 4 + 10) : 0
  const infoBoxH = infoRowsH + 8 + obsBlockH

  doc.setFillColor(...corSecundaria)
  doc.setDrawColor(...corBorda)
  doc.roundedRect(margin, y, pageWidth - margin * 2, infoBoxH, 2, 2, "FD")

  infoRows.forEach((row: any, ri: any) => {
    const rowY = y + 4 + ri * 15
    row.forEach((cell: any, ci: any) => {
      const cx = margin + 8 + ci * (colW + 4)
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.setTextColor(...corTexto)
      doc.text(cell.title, cx, rowY)
      doc.setFont("helvetica", "normal").setFontSize(8)
      doc.text(cell.value, cx, rowY + 4)
    })
  })

  if (data.observacoes && obsParts.length > 0) {
    const obsY = y + infoRowsH + 8
    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.setTextColor(...corTexto)
    doc.text("Observações:", margin + 8, obsY)
    doc.setFont("helvetica", "normal").setFontSize(7.5)
    doc.setTextColor(...corTextoSec)
    doc.text(obsParts, margin + 8, obsY + 4)
  }

  y += infoBoxH + 6

  // ── Itens table ──
  doc.setFillColor(...corHeader)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
  doc.setTextColor(...corHeaderText)
  doc.setFontSize(8).setFont("helvetica", "bold")
  doc.text("ITENS DE CORTE", margin + 4, y + 5)
  y += 7 + 3

  const tableHead = [["#", "Cód. Produto", "Ordem", "Artigo", "Cor", "Desenho", "Quantidade"]]
  const tableBody: string[][] = []
  let numSeq = 0
  for (const g of itensAgrupados) {
    numSeq++
    tableBody.push([
      String(numSeq),
      g.item.codigoProduto || "—",
      g.item.ordem || "—",
      g.item.artigo || "—",
      g.item.cor || "—",
      g.item.desenho || "—",
      g.qtd,
    ])
  }

  const footerId = data.id

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
      0: { cellWidth: tableW * 0.05, halign: "center" },
      1: { cellWidth: tableW * 0.17 },
      2: { cellWidth: tableW * 0.12 },
      3: { cellWidth: tableW * 0.16 },
      4: { cellWidth: tableW * 0.12 },
      5: { cellWidth: tableW * 0.17 },
      6: { cellWidth: tableW * 0.21, halign: "center" },
    },
    didDrawPage: (pageData: any) => {
      doc.setDrawColor(...corBorda)
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
      doc.setTextColor(...corTextoSec)
      doc.setFontSize(7).setFont("helvetica", "normal")
      doc.text(`Requisição de Corte Nº ${footerId}`, margin, pageHeight - 7)
      doc.text(`Página ${pageData.pageNumber}`, pageWidth - margin, pageHeight - 7, { align: "right" })
      doc.setTextColor(...corTexto)
    },
  })

  // ── Total row ──
  const afterTableY = (doc as any).lastAutoTable?.finalY ?? y + 10
  doc.setFillColor(...corHeader)
  doc.roundedRect(margin, afterTableY, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
  doc.setTextColor(...corHeaderText)
  doc.setFontSize(7.5).setFont("helvetica", "bold")
  const totalLabelX = margin + 4
  doc.text(`TOTAL: ${itensAgrupados.length} grupo(s) — ${data.itens.length} item(ns) — Qtd: ${totalQtd}`, totalLabelX, afterTableY + 5)

  // ── Footer on each page (handled by didDrawPage in autoTable) ──

  const nomeArquivo = `requisicao-corte-${data.id}.pdf`
  doc.save(nomeArquivo)
  toast.success("PDF gerado com sucesso!")
}

export async function gerarRequisicaoCortePdfConsolidado(lista: RequisicaoCorteData[], orientation: "portrait" | "landscape" = "portrait") {
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

  const doc = new jsPDF(orientation === "landscape" ? "landscape" : "portrait")
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
    const headerH = 28

    if (empresa) {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, headerH, "F")

      if (logoImg) {
        const maxW = 18
        const maxH = 18
        const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1)
        doc.addImage(logoImg, "PNG", margin, (headerH - logoImg.height * scale) / 2, logoImg.width * scale, logoImg.height * scale)
      }

      const textX = logoImg ? margin + 18 + 8 : margin + 6
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(11).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", textX, 11)
      doc.setFontSize(7).setFont("helvetica", "normal")
      doc.text(empresa.nome || "", textX, 18)
      if (empresa.documento) {
        doc.setFontSize(6.5)
        doc.text(`CNPJ: ${empresa.documento}`, textX, 24)
      }

      doc.setFontSize(11).setFont("helvetica", "bold")
      doc.setTextColor(...corHeaderText)
      doc.text(`Nº ${data.id}`, pageWidth - margin, headerH / 2, { align: "right" })

      y = headerH + 5
    } else {
      doc.setFillColor(...corHeader)
      doc.rect(0, 0, pageWidth, 22, "F")
      doc.setTextColor(...corHeaderText)
      doc.setFontSize(11).setFont("helvetica", "bold")
      doc.text("REQUISIÇÃO DE CORTE", pageWidth / 2, 9, { align: "center" })
      doc.setFontSize(9)
      doc.text(`Nº ${data.id}`, pageWidth / 2, 17, { align: "center" })
      y = 30
    }

    return y
  }

  let logoImg: HTMLImageElement | null = null
  if (empresa && empresa.logoUrl) {
    try {
      logoImg = await loadImage(empresa.logoUrl)
    } catch {}
  }

  const totalGeralQtd = lista.reduce((acc: any, r: any) => {
    return acc + r.itens.reduce((s: any, item: any) => {
      const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
      return s + (isNaN(num) ? 0 : num)
    }, 0)
  }, 0)

  const totalGeralItens = lista.reduce((acc: any, r: any) => acc + r.itens.length, 0)

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
    const totalQtd = data.itens.reduce((acc: any, item: any) => {
      const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
      return acc + (isNaN(num) ? 0 : num)
    }, 0)

    doc.setFillColor(...corHeader)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
    doc.setTextColor(...corHeaderText)
    doc.setFontSize(8).setFont("helvetica", "bold")
    doc.text("INFORMAÇÕES", margin + 4, y + 5)
    y += 7 + 3

    const infoBoxH = 53
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
        { title: "Data Solicitação", value: data.dataSolicitacao ? new Date(data.dataSolicitacao + "T12:00:00").toLocaleDateString("pt-BR") : "—" },
        { title: "Data Entrega", value: data.dataEntrega ? new Date(data.dataEntrega + "T12:00:00").toLocaleDateString("pt-BR") : "—" },
        { title: "Entregue por", value: data.entreguePor || "—" },
      ],
      [
        { title: "Total Itens", value: String(data.itens.length || 0) },
        { title: "Quantidade Total", value: String(totalQtd) },
        { title: "", value: "" },
      ],
    ]

    const infoRowsH = 45
    const obsPartsC = data.observacoes ? doc.splitTextToSize(data.observacoes, pageWidth - margin * 2 - 16) : []
    const obsBlockHC = data.observacoes ? Math.max(14, obsPartsC.length * 4 + 10) : 0
    const infoBoxHC = infoRowsH + 8 + obsBlockHC

    doc.setFillColor(...corSecundaria)
    doc.setDrawColor(...corBorda)
    doc.roundedRect(margin, y, pageWidth - margin * 2, infoBoxHC, 2, 2, "FD")

    infoData.forEach((row: any, ri: any) => {
      const rowY = y + 4 + ri * 15
      row.forEach((cell: any, ci: any) => {
        const cx = margin + 8 + ci * (colW + 4)
        doc.setFont("helvetica", "bold").setFontSize(7)
        doc.setTextColor(...corTexto)
        doc.text(cell.title, cx, rowY)
        doc.setFont("helvetica", "normal").setFontSize(8)
        doc.text(cell.value, cx, rowY + 4)
      })
    })

    if (data.observacoes && obsPartsC.length > 0) {
      const obsYC = y + infoRowsH + 8
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.setTextColor(...corTexto)
      doc.text("Observações:", margin + 8, obsYC)
      doc.setFont("helvetica", "normal").setFontSize(7.5)
      doc.setTextColor(...corTextoSec)
      doc.text(obsPartsC, margin + 8, obsYC + 4)
    }

    y += infoBoxHC + 6

    // Itens table
    doc.setFillColor(...corHeader)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
    doc.setTextColor(...corHeaderText)
    doc.setFontSize(8).setFont("helvetica", "bold")
    doc.text("ITENS DE CORTE", margin + 4, y + 5)
    y += 7 + 3

    function agruparItensConsol(itens: RequisicaoCorteData["itens"]) {
      const mapa = new Map<string, { item: RequisicaoCorteData["itens"][0]; qtd: string; qtdNum: number }>()
      for (const item of itens) {
        const chave = [item.codigoProduto, item.ordem, item.artigo, item.cor, item.desenho].join("||")
        const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
        const existente = mapa.get(chave)
        if (existente) {
          existente.qtd += " + " + item.quantidade
          existente.qtdNum += isNaN(num) ? 0 : num
        } else {
          mapa.set(chave, { item, qtd: item.quantidade, qtdNum: isNaN(num) ? 0 : num })
        }
      }
      return Array.from(mapa.values())
    }

    const itensAgrupadosC = agruparItensConsol(data.itens)
    const footerIdC = data.id

    const tableHeadC = [["#", "Cód. Produto", "Ordem", "Artigo", "Cor", "Desenho", "Quantidade"]]
    const tableBodyC: string[][] = []
    let numSeqC = 0
    for (const g of itensAgrupadosC) {
      numSeqC++
      tableBodyC.push([
        String(numSeqC),
        g.item.codigoProduto || "—",
        g.item.ordem || "—",
        g.item.artigo || "—",
        g.item.cor || "—",
        g.item.desenho || "—",
        g.qtd,
      ])
    }

    const tableW = pageWidth - margin * 2
    ;(doc as any).autoTable({
      head: tableHeadC,
      body: tableBodyC,
      startY: y,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [...corHeader], textColor: [...corHeaderText], fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [...corSecundaria] },
      margin: { left: margin, right: margin, top: 10, bottom: 16 },
      tableLineColor: [...corBorda],
      tableLineWidth: 0.5,
      columnStyles: {
        0: { cellWidth: tableW * 0.05, halign: "center" },
        1: { cellWidth: tableW * 0.17 },
        2: { cellWidth: tableW * 0.12 },
        3: { cellWidth: tableW * 0.16 },
        4: { cellWidth: tableW * 0.12 },
        5: { cellWidth: tableW * 0.17 },
        6: { cellWidth: tableW * 0.21, halign: "center" },
      },
      didDrawPage: (pageData: any) => {
        doc.setDrawColor(...corBorda)
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
        doc.setTextColor(...corTextoSec)
        doc.setFontSize(7).setFont("helvetica", "normal")
        doc.text(`Requisição de Corte Nº ${footerIdC}`, margin, pageHeight - 7)
        doc.text(`Página ${pageData.pageNumber}`, pageWidth - margin, pageHeight - 7, { align: "right" })
        doc.setTextColor(...corTexto)
      },
    })

    // ── Total row per page ──
    const afterTableYC = (doc as any).lastAutoTable?.finalY ?? y + 10
    doc.setFillColor(...corHeader)
    doc.roundedRect(margin, afterTableYC, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
    doc.setTextColor(...corHeaderText)
    doc.setFontSize(7.5).setFont("helvetica", "bold")
    doc.text(`TOTAL: ${itensAgrupadosC.length} grupo(s) — ${data.itens.length} item(ns) — Qtd: ${totalQtd}`, margin + 4, afterTableYC + 5)
  }

  const sufixo = lista.length <= 3 ? lista.map((r: any) => r.id).join("-") : `${lista[0].id}-${lista[lista.length - 1].id}`
  doc.save(`requisicoes-corte-${sufixo}.pdf`)
  toast.success(`PDF consolidado com ${lista.length} requisição(ões) gerado!`)
}
