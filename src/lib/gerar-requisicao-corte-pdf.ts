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

function formatarQtdCorte(qtd: number, count: number, pecas: number[]): string {
  if (count <= 1) return String(qtd)
  const todosIguais = pecas.every((p) => p === pecas[0])
  if (todosIguais) return `${pecas[0]}m × ${count}pç`
  return `${count}pç (${pecas.join("+")})`
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

  // ── Itens table (romaneio-style grouping) ──
  doc.setFillColor(...corHeader)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
  doc.setTextColor(...corHeaderText)
  doc.setFontSize(8).setFont("helvetica", "bold")
  doc.text("ITENS DE CORTE", margin + 4, y + 5)
  y += 7 + 3

  const NUM_COLS = 7
  const tableHead = [["#", "Cód. Produto", "Ordem", "Artigo", "Cor", "Desenho", "Qtd."]]
  const tableBody: any[][] = []

  const produtosMap = new Map<string, RequisicaoCorteData["itens"]>()
  for (const item of data.itens) {
    const prod = item.codigoProduto || "SEM PRODUTO"
    if (!produtosMap.has(prod)) produtosMap.set(prod, [])
    produtosMap.get(prod)!.push(item)
  }
  const produtosOrdenados = Array.from(produtosMap.entries()).sort((a: any, b: any) => a[0].localeCompare(b[0]))

  let numSeq = 0
  let totalGeralQtd = 0
  let totalGeralItens = 0

  for (const [prodNome, prodItens] of produtosOrdenados) {
    let prodQtd = 0

    tableBody.push([
      {
        content: `PRODUTO: ${prodNome}`,
        colSpan: NUM_COLS,
        styles: { fillColor: [233, 213, 255], fontStyle: "bold", fontSize: 7, halign: "left" },
      },
    ])

    const aggMap = new Map<string, { item: RequisicaoCorteData["itens"][0]; qtd: number; count: number; pecas: number[] }>()
    for (const item of prodItens) {
      const key = `${item.ordem}||${item.artigo}||${item.cor}||${item.desenho}`
      const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
      const val = isNaN(num) ? 0 : num
      if (aggMap.has(key)) {
        const existing = aggMap.get(key)!
        existing.qtd += val
        existing.count++
        existing.pecas.push(val)
      } else {
        aggMap.set(key, { item, qtd: val, count: 1, pecas: [val] })
      }
    }

    const aggSorted = Array.from(aggMap.values()).sort((a: any, b: any) => {
      const aKey = `${a.item.ordem}||${a.item.artigo}||${a.item.cor}||${a.item.desenho}`
      const bKey = `${b.item.ordem}||${b.item.artigo}||${b.item.cor}||${b.item.desenho}`
      return aKey.localeCompare(bKey)
    })

    for (const agg of aggSorted) {
      numSeq++
      prodQtd += agg.qtd
      tableBody.push([
        String(numSeq),
        agg.item.codigoProduto || "—",
        agg.item.ordem || "—",
        agg.item.artigo || "—",
        agg.item.cor || "—",
        agg.item.desenho || "—",
        formatarQtdCorte(agg.qtd, agg.count, agg.pecas),
      ])
    }

    totalGeralQtd += prodQtd
    totalGeralItens += prodItens.length

    tableBody.push([
      { content: `SUBTOTAL ${prodNome}: ${prodItens.length} item(ns)`, colSpan: NUM_COLS - 1, styles: { fontStyle: "bold", fontSize: 7, fillColor: [233, 213, 255] } },
      { content: String(prodQtd), styles: { fontStyle: "bold", fontSize: 7, fillColor: [233, 213, 255], halign: "center" } },
    ])
  }

  tableBody.push([
    { content: `TOTAL GERAL: ${totalGeralItens} item(ns)`, colSpan: NUM_COLS - 1, styles: { fontStyle: "bold", fontSize: 8, fillColor: [191, 219, 254] } },
    { content: String(totalGeralQtd), styles: { fontStyle: "bold", fontSize: 8, fillColor: [191, 219, 254], halign: "center" } },
  ])

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

    // Itens table (romaneio-style grouping)
    doc.setFillColor(...corHeader)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 1.5, 1.5, "F")
    doc.setTextColor(...corHeaderText)
    doc.setFontSize(8).setFont("helvetica", "bold")
    doc.text("ITENS DE CORTE", margin + 4, y + 5)
    y += 7 + 3

    const NUM_COLS_C = 7
    const tableHeadC = [["#", "Cód. Produto", "Ordem", "Artigo", "Cor", "Desenho", "Qtd."]]
    const tableBodyC: any[][] = []

    const produtosMapC = new Map<string, RequisicaoCorteData["itens"]>()
    for (const item of data.itens) {
      const prod = item.codigoProduto || "SEM PRODUTO"
      if (!produtosMapC.has(prod)) produtosMapC.set(prod, [])
      produtosMapC.get(prod)!.push(item)
    }
    const produtosOrdenadosC = Array.from(produtosMapC.entries()).sort((a: any, b: any) => a[0].localeCompare(b[0]))

    let numSeqC = 0
    let totalGeralQtdC = 0

    for (const [prodNome, prodItens] of produtosOrdenadosC) {
      let prodQtd = 0

      tableBodyC.push([
        {
          content: `PRODUTO: ${prodNome}`,
          colSpan: NUM_COLS_C,
          styles: { fillColor: [233, 213, 255], fontStyle: "bold", fontSize: 7, halign: "left" },
        },
      ])

      const aggMapC = new Map<string, { item: RequisicaoCorteData["itens"][0]; qtd: number; count: number; pecas: number[] }>()
      for (const item of prodItens) {
        const key = `${item.ordem}||${item.artigo}||${item.cor}||${item.desenho}`
        const num = parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
        const val = isNaN(num) ? 0 : num
        if (aggMapC.has(key)) {
          const existing = aggMapC.get(key)!
          existing.qtd += val
          existing.count++
          existing.pecas.push(val)
        } else {
          aggMapC.set(key, { item, qtd: val, count: 1, pecas: [val] })
        }
      }

      const aggSortedC = Array.from(aggMapC.values()).sort((a: any, b: any) => {
        const aKey = `${a.item.ordem}||${a.item.artigo}||${a.item.cor}||${a.item.desenho}`
        const bKey = `${b.item.ordem}||${b.item.artigo}||${b.item.cor}||${b.item.desenho}`
        return aKey.localeCompare(bKey)
      })

      for (const agg of aggSortedC) {
        numSeqC++
        prodQtd += agg.qtd
        tableBodyC.push([
          String(numSeqC),
          agg.item.codigoProduto || "—",
          agg.item.ordem || "—",
          agg.item.artigo || "—",
          agg.item.cor || "—",
          agg.item.desenho || "—",
          formatarQtdCorte(agg.qtd, agg.count, agg.pecas),
        ])
      }

      totalGeralQtdC += prodQtd

      tableBodyC.push([
        { content: `SUBTOTAL ${prodNome}: ${prodItens.length} item(ns)`, colSpan: NUM_COLS_C - 1, styles: { fontStyle: "bold", fontSize: 7, fillColor: [233, 213, 255] } },
        { content: String(prodQtd), styles: { fontStyle: "bold", fontSize: 7, fillColor: [233, 213, 255], halign: "center" } },
      ])
    }

    tableBodyC.push([
      { content: `TOTAL GERAL: ${data.itens.length} item(ns)`, colSpan: NUM_COLS_C - 1, styles: { fontStyle: "bold", fontSize: 8, fillColor: [191, 219, 254] } },
      { content: String(totalGeralQtdC), styles: { fontStyle: "bold", fontSize: 8, fillColor: [191, 219, 254], halign: "center" } },
    ])

    const footerIdC = data.id

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
  }

  const sufixo = lista.length <= 3 ? lista.map((r: any) => r.id).join("-") : `${lista[0].id}-${lista[lista.length - 1].id}`
  doc.save(`requisicoes-corte-${sufixo}.pdf`)
  toast.success(`PDF consolidado com ${lista.length} requisição(ões) gerado!`)
}
