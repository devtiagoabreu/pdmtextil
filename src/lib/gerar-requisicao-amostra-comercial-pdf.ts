"use client"

import { toast } from "sonner"

export async function gerarRequisicaoAmostraComercialPdf(id: number | string) {
  const [reqRes, empresaRes] = await Promise.all([
    fetch(`/api/requisicoes-amostra-comercial/${id}`).then(r => r.json()).catch(() => null),
    fetch("/api/admin/config/empresa").then(r => r.json()).catch(() => []),
  ])

  if (!reqRes) {
    toast.error("Erro ao carregar dados da requisição")
    return
  }

  const empresa = Array.isArray(empresaRes) ? empresaRes.find((e: any) => e.isDefault) || empresaRes[0] : null

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
    const prodBoxH = 36

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
    doc.setFont("helvetica", "bold").setFontSize(7)
    doc.text("Código PDM", cx1, py1)
    doc.text("Descrição", cx2, py1)
    doc.text("", cx3, py1)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text(reqRes.produtoCodigo, cx1, py1 + 4)
    const descParts = doc.splitTextToSize(reqRes.produtoDescricao || "—", colW * 2)
    doc.text(descParts, cx2, py1 + 4)

    y = prodBoxY + prodBoxH + 6
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
