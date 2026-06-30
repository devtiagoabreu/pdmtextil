"use client"

import { toast } from "sonner"

interface AmostraData {
  id: number
  tipoAmostra: string
  descricao?: string | null
  status: string
  observacoes?: string | null
  data?: string | null
  links?: { url: string; descricao: string }[] | null
  quantidadeProduzida?: string | null
  dados?: Record<string, string> | null
  produtoCodigo?: string | null
  produtoDescricao?: string | null
}

interface SolicitacaoData {
  id: number
  tipo: string
  status: string
  cliente: string
  cnpj?: string | null
  projeto?: string | null
  prazoDesejado?: string | null
  observacoes?: string | null
  anexos?: { id: number; tipo: string; titulo: string; url: string }[] | null
}

interface ProdutoData {
  id: number
  codigoPdm: string
  descricao: string
  status: string
  idIntegracao?: string | null
  idIntegracaoErpCru?: string | null
  fichaTecnica?: {
    gramatura?: string
    gramaturaLinear?: string
    largura?: string
    passamento?: string
    batidas?: string
    densidade?: string
    ligamento?: string
    qtdeFiosUrdume?: string
    observacoes?: string
  } | null
  composicao?: { material: string; percentual: string }[]
  links?: { url: string; descricao: string }[]
}

export async function gerarSolicitacaoAmostraPdf(params: {
  amostra: AmostraData
  produtoCruId?: number | null
  solicitacaoDesenvolvimentoId?: number | null
}) {
  const { amostra } = params

  const [solRes, prodRes] = await Promise.all([
    params.solicitacaoDesenvolvimentoId
      ? fetch(`/api/solicitacoes/${params.solicitacaoDesenvolvimentoId}`).then(r => r.json()).catch(() => null) as Promise<SolicitacaoData | null>
      : null,
    params.produtoCruId
      ? fetch(`/api/cadastros/produto-cru/${params.produtoCruId}`).then(r => r.json()).catch(() => null) as Promise<ProdutoData | null>
      : null,
  ])

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

  const doc = new jsPDF("portrait")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  let y = margin

  const corPrimaria: [number, number, number] = [7, 63, 184]
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
    doc.text("SOLICITAÇÃO DE AMOSTRA", textX, 17)
    doc.setFontSize(9).setFont("helvetica", "normal")
    doc.text(empresa.nome || "", textX, 28)
    if (empresa.documento) {
      doc.setFontSize(8)
      doc.text(`CNPJ: ${empresa.documento}`, textX, 38)
    }
    y = headerH + 4
  } else {
    doc.setFillColor(...corPrimaria)
    doc.rect(0, 0, pageWidth, 32, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14).setFont("helvetica", "bold")
    doc.text("SOLICITAÇÃO DE AMOSTRA", pageWidth / 2, 14, { align: "center" })
    y = 42
  }

  doc.setTextColor(...corTexto)

  // ── Seção 1: Solicitação de Desenvolvimento ──
  if (solRes) {
    const solLabelY = y + 12

    const linksSol = (solRes.anexos || []).filter((a: any) => a.tipo === "LINK")
    const temLinksSol = linksSol.length > 0
    const solBoxH = temLinksSol ? 48 : 34

    doc.setFillColor(...corPrimaria)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9).setFont("helvetica", "bold")
    doc.text(`SOLICITAÇÃO DE DESENVOLVIMENTO Nº ${solRes.id}`, margin + 4, y + 6)

    doc.setTextColor(...corTexto)
    doc.setFillColor(...corSecundaria)
    doc.setDrawColor(...corBorda)
    doc.roundedRect(margin, y + 8, pageWidth - margin * 2, solBoxH, 2, 2, "FD")

    doc.setFontSize(7).setFont("helvetica", "bold")
    doc.text("Cliente", cx1, solLabelY)
    doc.text("Projeto", cx2, solLabelY)
    doc.text("Tipo", cx3, solLabelY)
    doc.setFont("helvetica", "normal").setFontSize(8)
    const clienteParts = doc.splitTextToSize(solRes.cliente || "—", colW - 4)
    doc.text(clienteParts, cx1, solLabelY + 4)
    const projParts = doc.splitTextToSize(solRes.projeto || "—", colW - 4)
    doc.text(projParts, cx2, solLabelY + 4)
    const tipoLabel =
      solRes.tipo === "DESENVOLVIMENTO_TECELAGEM"
        ? "Desenvolvimento Tecelagem"
        : solRes.tipo === "DESENVOLVIMENTO_BENEFICIAMENTO"
        ? "Desenvolvimento Beneficiamento"
        : solRes.tipo || "—"
    doc.text(tipoLabel, cx3, solLabelY + 4)

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Status", cx1, solLabelY + 11)
    doc.text("Prazo Desejado", cx2, solLabelY + 11)
    doc.text("CNPJ", cx3, solLabelY + 11)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(solRes.status || "—", cx1, solLabelY + 15)
    doc.text(
      solRes.prazoDesejado
        ? new Date(solRes.prazoDesejado).toLocaleDateString("pt-BR")
        : "—",
      cx2,
      solLabelY + 15
    )
    doc.text(solRes.cnpj || "—", cx3, solLabelY + 15)

    if (temLinksSol) {
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.text("Links", cx1, solLabelY + 24)
      doc.setFont("helvetica", "normal").setFontSize(7)
      doc.setTextColor(37, 99, 235)
      let ly = solLabelY + 28
      for (const link of linksSol) {
        const txt = link.titulo || link.url
        doc.textWithLink(txt, cx1, ly, { url: link.url })
        ly += 4
      }
      doc.setTextColor(...corTexto)
    }

    y = y + 8 + solBoxH + 6
  }

  // ── Seção 2: Produto ──
  if (prodRes) {
    const temLinksProd = prodRes.links && prodRes.links.length > 0
    const prodBoxH = temLinksProd ? 57 : 44

    doc.setFillColor(...corPrimaria)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9).setFont("helvetica", "bold")
    doc.text(`PRODUTO — ${prodRes.codigoPdm}`, margin + 4, y + 6)

    const prodBoxY = y + 8
    doc.setTextColor(...corTexto)
    doc.setFillColor(...corSecundaria)
    doc.setDrawColor(...corBorda)
    doc.roundedRect(margin, prodBoxY, pageWidth - margin * 2, prodBoxH, 2, 2, "FD")

    const py1 = prodBoxY + 7
    const py2 = py1 + 13
    const py3 = py2 + 13

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Código PDM", cx1, py1)
    doc.text("Descrição", cx2, py1)
    doc.text("Status", cx3, py1)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(prodRes.codigoPdm || "—", cx1, py1 + 4)
    const descParts = doc.splitTextToSize(prodRes.descricao || "—", colW - 4)
    doc.text(descParts, cx2, py1 + 4)
    doc.text(prodRes.status || "—", cx3, py1 + 4)

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Gramatura", cx1, py2)
    doc.text("Largura", cx2, py2)
    doc.text("Ligamento", cx3, py2)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(prodRes.fichaTecnica?.gramatura || "—", cx1, py2 + 4)
    doc.text(prodRes.fichaTecnica?.largura || "—", cx2, py2 + 4)
    doc.text(prodRes.fichaTecnica?.ligamento || "—", cx3, py2 + 4)

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Composição", cx1, py3)
    doc.text("ID Integração", cx2, py3)
    doc.text("ID ERP Cru", cx3, py3)
    doc.setFont("helvetica", "normal").setFontSize(8)
    const compStr =
      prodRes.composicao && prodRes.composicao.length > 0
        ? prodRes.composicao
            .map((c: any) => `${c.material} ${c.percentual}%`)
            .join(" | ")
        : "—"
    const compParts = doc.splitTextToSize(compStr, colW - 4)
    doc.text(compParts, cx1, py3 + 4)
    doc.text(prodRes.idIntegracao || "—", cx2, py3 + 4)
    doc.text(prodRes.idIntegracaoErpCru || "—", cx3, py3 + 4)

    // Links do produto — fourth row when present
    if (prodRes.links && prodRes.links.length > 0) {
      const linkRowY = py3 + 13
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.text("Links", cx1, linkRowY)
      doc.setFont("helvetica", "normal").setFontSize(7)
      doc.setTextColor(37, 99, 235)
      let ly = linkRowY + 4
      const lw = colW * 2 + 4
      for (const link of prodRes.links) {
        const txt = link.descricao || link.url
        const fit = doc.splitTextToSize(txt, lw)
        if (fit.length > 0) {
          doc.textWithLink(fit[0], cx1, ly, { url: link.url })
          ly += 4
          if (ly > prodBoxY + prodBoxH - 4) break
        }
      }
      doc.setTextColor(...corTexto)
    }

    y = prodBoxY + prodBoxH + 6
  }

  // ── Seção 3: Amostra ──
  const tipoLabelAmostra = amostra.tipoAmostra === "TECIDO_CRU" ? "TECIDO CRU" : amostra.tipoAmostra === "ACABAMENTO" ? "ACABAMENTO" : amostra.tipoAmostra
  const temLinks = amostra.links && amostra.links.length > 0
  const temQuant = amostra.quantidadeProduzida
  const temTear = amostra.dados?.tear
  const extraRows = [temLinks, temTear].filter(Boolean).length
  const amostraBoxH = 30 + extraRows * 12

  doc.setFillColor(...corPrimaria)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9).setFont("helvetica", "bold")
  doc.text(`AMOSTRA — ${tipoLabelAmostra} Nº ${amostra.id}`, margin + 4, y + 6)

  const amostraBoxY = y + 8
  doc.setTextColor(...corTexto)
  doc.setFillColor(...corSecundaria)
  doc.setDrawColor(...corBorda)
  doc.roundedRect(margin, amostraBoxY, pageWidth - margin * 2, amostraBoxH, 2, 2, "FD")

  const ay1 = amostraBoxY + 7
  const ay2 = ay1 + 12
  const ay3 = ay2 + 12

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Tipo", cx1, ay1)
  doc.text("Descrição", cx2, ay1)
  doc.text("Metragem", cx3, ay1)
  doc.setFont("helvetica", "normal").setFontSize(8)
  doc.text(
    amostra.tipoAmostra === "TECIDO_CRU" ? "Tecido Cru" : amostra.tipoAmostra === "ACABAMENTO" ? "Acabamento" : amostra.tipoAmostra,
    cx1,
    ay1 + 4
  )
  doc.text(amostra.descricao || "—", cx2, ay1 + 4)
  doc.text(amostra.quantidadeProduzida || "—", cx3, ay1 + 4)

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Data", cx1, ay2)
  doc.text("Status", cx2, ay2)
  doc.text("Observações", cx3, ay2)
  doc.setFont("helvetica", "normal").setFontSize(8)
  doc.text(amostra.data ? new Date(amostra.data).toLocaleDateString("pt-BR") : "—", cx1, ay2 + 4)
  const statusLabel: Record<string, string> = {
    PENDENTE: "Pendente",
    APROVADO: "Aprovado",
    REPROVADA: "Reprovada",
  }
  doc.text(statusLabel[amostra.status] || amostra.status, cx2, ay2 + 4)
  const obsParts = doc.splitTextToSize(amostra.observacoes || "—", colW - 4)
  doc.text(obsParts, cx3, ay2 + 4)

  let nextRow = ay3

  if (temTear) {
    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Tear", cx1, nextRow)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(amostra.dados!.tear!, cx1, nextRow + 4)
    nextRow += 12
  }

  if (temLinks) {
    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Links", cx1, nextRow)
    doc.setTextColor(37, 99, 235)
    doc.setFont("helvetica", "normal").setFontSize(7)
    let ly3 = nextRow + 4
    for (const link of amostra.links!) {
      const txt = link.descricao || link.url
      doc.textWithLink(txt, cx1, ly3, { url: link.url })
      ly3 += 4
    }
    doc.setTextColor(...corTexto)
  }

  y = amostraBoxY + amostraBoxH + 6

  // ── Footer ──
  if (y > pageHeight - 30) {
    doc.addPage()
    y = margin
  }
  doc.setDrawColor(...corBorda)
  doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)
  doc.setTextColor(...corTextoSec)
  doc.setFontSize(7).setFont("helvetica", "normal")
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    margin,
    pageHeight - 12
  )
  doc.text("Solicitação de Amostra", pageWidth - margin, pageHeight - 12, { align: "right" })

  const nomeArquivo = `solicitacao-amostra-${amostra.produtoCodigo || amostra.id}-${amostra.id}.pdf`
  doc.save(nomeArquivo)
  toast.success("PDF gerado com sucesso!")
}
