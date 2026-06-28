"use client"

import { toast } from "sonner"

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

export async function gerarRequisicaoAmostraComercialPdf(id: number | string) {
  const [reqRes, empresaRes] = await Promise.all([
    fetch(`/api/requisicoes-amostra-comercial/${id}`).then(r => r.json()).catch(() => null),
    fetch("/api/admin/config/empresa").then(r => r.json()).catch(() => []),
  ])

  if (!reqRes) {
    toast.error("Erro ao carregar dados da requisição")
    return
  }

  let produtoData: any = null
  let amostraDesenvolvimento: any = null
  if (reqRes.produtoCruId) {
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${reqRes.produtoCruId}`)
      if (res.ok) {
        produtoData = await res.json()
        const todasAmostras = [
          ...(produtoData.amostras || []).map((a: any) => ({ ...a, tipo: "TECIDO_CRU" })),
          ...(produtoData.acabamentos || []).flatMap((acab: any) =>
            (acab.amostras || []).map((a: any) => ({ ...a, tipo: "ACABAMENTO", acabamentoDescricao: acab.descricao }))
          ),
        ]
        amostraDesenvolvimento = todasAmostras.find((a: any) => a.status === "APROVADO_COMERCIAL")
          || todasAmostras.find((a: any) => a.status === "APROVADO_DESENVOLVIMENTO")
          || null
      }
    } catch {}
  }

  const empresa = Array.isArray(empresaRes) ? empresaRes.find((e: any) => e.isDefault) || empresaRes[0] : null

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
  if (empresa?.logoUrl) {
    try { logoImg = await loadImage(empresa.logoUrl) } catch {}
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
    doc.text("REQUISIÇÃO DE AMOSTRA COMERCIAL", textX, 17)
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
    doc.text("REQUISIÇÃO DE AMOSTRA COMERCIAL", pageWidth / 2, 14, { align: "center" })
    y = 42
  }

  doc.setTextColor(...corTexto)

  // ── Seção 1: Dados da Requisição ──
  const reqBoxH = 82

  doc.setFillColor(...corPrimaria)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9).setFont("helvetica", "bold")
  doc.text(`REQUISIÇÃO Nº ${reqRes.id}`, margin + 4, y + 6)

  const reqBoxY = y + 8
  doc.setTextColor(...corTexto)
  doc.setFillColor(...corSecundaria)
  doc.setDrawColor(...corBorda)
  doc.roundedRect(margin, reqBoxY, pageWidth - margin * 2, reqBoxH, 2, 2, "FD")

  const ry1 = reqBoxY + 7
  const ry2 = ry1 + 12
  const ry3 = ry2 + 12
  const ry4 = ry3 + 12
  const ry5 = ry4 + 12

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Título", cx1, ry1)
  doc.text("Cliente", cx2, ry1)
  doc.text("Quantidade", cx3, ry1)
  doc.setFont("helvetica", "normal").setFontSize(8)
  const tituloParts = doc.splitTextToSize(reqRes.titulo || "—", colW - 4)
  doc.text(tituloParts, cx1, ry1 + 4)
  doc.text(reqRes.cliente || "—", cx2, ry1 + 4)
  doc.text(reqRes.quantidade || "—", cx3, ry1 + 4)

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Status", cx1, ry2)
  doc.text("Prazo Desejado", cx2, ry2)
  doc.text("Criado em", cx3, ry2)
  doc.setFont("helvetica", "normal").setFontSize(8)
  doc.text(reqRes.status || "—", cx1, ry2 + 4)
  doc.text(
    reqRes.prazoDesejado ? new Date(reqRes.prazoDesejado).toLocaleDateString("pt-BR") : "—",
    cx2, ry2 + 4
  )
  doc.text(
    reqRes.createdAt ? new Date(reqRes.createdAt).toLocaleDateString("pt-BR") : "—",
    cx3, ry2 + 4
  )

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Solicitante", cx1, ry3)
  doc.text("Solic. Desenvolvimento", cx2, ry3)
  doc.text("", cx3, ry3)
  doc.setFont("helvetica", "normal").setFontSize(8)
  doc.text(reqRes.solicitanteNome || "—", cx1, ry3 + 4)
  doc.text(reqRes.solicitacaoDesenvolvimentoId ? `#${reqRes.solicitacaoDesenvolvimentoId}` : "—", cx2, ry3 + 4)

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Motivo", cx1, ry4)
  doc.setFont("helvetica", "normal").setFontSize(8)
  const motivoParts = doc.splitTextToSize(reqRes.motivo || "—", pageWidth - margin * 2 - 16)
  doc.text(motivoParts, cx1, ry4 + 4)

  doc.setFont("helvetica", "bold").setFontSize(7)
  doc.text("Observações", cx1, ry5)
  doc.setFont("helvetica", "normal").setFontSize(8)
  const obsParts = doc.splitTextToSize(reqRes.observacoes || "—", pageWidth - margin * 2 - 16)
  doc.text(obsParts, cx1, ry5 + 4)

  y = reqBoxY + reqBoxH + 6

  // ── Seção 2: Produto ──
  if (reqRes.produtoCodigo) {
    const temLinksProd = produtoData?.links && produtoData.links.length > 0
    const temComposicao = produtoData?.composicao && produtoData.composicao.length > 0
    const prodBoxH = 36 + (temLinksProd ? 12 : 0) + (temComposicao ? 5 : 0)

    doc.setFillColor(...corPrimaria)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9).setFont("helvetica", "bold")
    doc.text(`PRODUTO CRU — ${reqRes.produtoCodigo}`, margin + 4, y + 6)

    const prodBoxY = y + 8
    doc.setTextColor(...corTexto)
    doc.setFillColor(...corSecundaria)
    doc.setDrawColor(...corBorda)
    doc.roundedRect(margin, prodBoxY, pageWidth - margin * 2, prodBoxH, 2, 2, "FD")

    const py1 = prodBoxY + 7
    const py2 = py1 + 12

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Código PDM", cx1, py1)
    doc.text("Descrição", cx2, py1)
    doc.text("Status", cx3, py1)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(reqRes.produtoCodigo, cx1, py1 + 4)
    const descParts = doc.splitTextToSize(reqRes.produtoDescricao || "—", colW - 4)
    doc.text(descParts, cx2, py1 + 4)
    doc.text(produtoData?.status || "—", cx3, py1 + 4)

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Gramatura", cx1, py2)
    doc.text("Largura", cx2, py2)
    doc.text("Ligamento", cx3, py2)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(produtoData?.fichaTecnica?.gramatura || "—", cx1, py2 + 4)
    doc.text(produtoData?.fichaTecnica?.largura || "—", cx2, py2 + 4)
    doc.text(produtoData?.fichaTecnica?.ligamento || "—", cx3, py2 + 4)

    let py3 = py2 + 12
    if (temComposicao) {
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.text("Composição", cx1, py3)
      doc.text("", cx2, py3)
      doc.text("", cx3, py3)
      doc.setFont("helvetica", "normal").setFontSize(8)
      const compStr = produtoData.composicao.map((c: any) => `${c.material} ${c.percentual}%`).join(" | ")
      const compParts = doc.splitTextToSize(compStr, colW * 2)
      doc.text(compParts, cx1, py3 + 4)
      py3 += 12
    }

    if (temLinksProd) {
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.text("Links", cx1, py3)
      doc.setTextColor(37, 99, 235)
      doc.setFont("helvetica", "normal").setFontSize(7)
      let ly = py3 + 4
      for (const link of produtoData.links) {
        const txt = link.descricao || link.url
        const fit = doc.splitTextToSize(txt, colW * 2)
        if (fit.length > 0) {
          doc.textWithLink(fit[0], cx1, ly, { url: link.url })
          ly += 4
        }
      }
      doc.setTextColor(...corTexto)
    }

    y = prodBoxY + prodBoxH + 6
  }

  // ── Seção 3: Amostra de Desenvolvimento ──
  if (amostraDesenvolvimento) {
    const temLinksAmostra = amostraDesenvolvimento.links && amostraDesenvolvimento.links.length > 0
    const amostraBoxH = 36 + (temLinksAmostra ? 12 : 0)

    if (y + 8 + amostraBoxH + 6 > pageHeight - 30) {
      doc.addPage()
      y = margin
    }

    doc.setFillColor(...corPrimaria)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9).setFont("helvetica", "bold")
    const labelStatus = amostraDesenvolvimento.status === "APROVADO_COMERCIAL" ? "APROVADA COMERCIAL" : "APROVADA DESENVOLVIMENTO"
    doc.text(`AMOSTRA DE DESENVOLVIMENTO — ${labelStatus}`, margin + 4, y + 6)

    const amostraBoxY = y + 8
    doc.setTextColor(...corTexto)
    doc.setFillColor(...corSecundaria)
    doc.setDrawColor(...corBorda)
    doc.roundedRect(margin, amostraBoxY, pageWidth - margin * 2, amostraBoxH, 2, 2, "FD")

    const ay1 = amostraBoxY + 7
    const ay2 = ay1 + 12

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Tipo", cx1, ay1)
    doc.text("Descrição", cx2, ay1)
    doc.text("Status", cx3, ay1)
    doc.setFont("helvetica", "normal").setFontSize(8)
    const tipoStr = amostraDesenvolvimento.tipo === "TECIDO_CRU"
      ? "Tecido Cru"
      : amostraDesenvolvimento.tipo === "ACABAMENTO"
        ? `Acabamento${amostraDesenvolvimento.acabamentoDescricao ? ` — ${amostraDesenvolvimento.acabamentoDescricao}` : ""}`
        : "—"
    doc.text(tipoStr, cx1, ay1 + 4)
    doc.text(amostraDesenvolvimento.descricao || "—", cx2, ay1 + 4)
    doc.text(amostraDesenvolvimento.status || "—", cx3, ay1 + 4)

    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Data", cx1, ay2)
    doc.text("Quantidade Produzida", cx2, ay2)
    doc.text("Observações", cx3, ay2)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(amostraDesenvolvimento.data ? new Date(amostraDesenvolvimento.data).toLocaleDateString("pt-BR") : "—", cx1, ay2 + 4)
    doc.text(amostraDesenvolvimento.quantidadeProduzida || "—", cx2, ay2 + 4)
    const obsAmostraParts = doc.splitTextToSize(amostraDesenvolvimento.observacoes || "—", colW - 4)
    doc.text(obsAmostraParts, cx3, ay2 + 4)

    if (temLinksAmostra) {
      const linkRowY = ay2 + 12
      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.text("Links", cx1, linkRowY)
      doc.setTextColor(37, 99, 235)
      doc.setFont("helvetica", "normal").setFontSize(7)
      let ly = linkRowY + 4
      for (const link of amostraDesenvolvimento.links) {
        const txt = link.descricao || link.url
        const fit = doc.splitTextToSize(txt, colW * 2)
        if (fit.length > 0) {
          doc.textWithLink(fit[0], cx1, ly, { url: link.url })
          ly += 4
        }
      }
      doc.setTextColor(...corTexto)
    }

    y = amostraBoxY + amostraBoxH + 6
  }

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
  doc.text("Requisição de Amostra Comercial", pageWidth - margin, pageHeight - 12, { align: "right" })

  const nomeArquivo = `requisicao-amostra-comercial-${reqRes.id}.pdf`
  doc.save(nomeArquivo)
  toast.success("PDF gerado com sucesso!")
}
