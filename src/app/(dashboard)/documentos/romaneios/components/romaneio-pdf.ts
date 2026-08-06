import type { GrupoRomaneio, OrientacaoPdf, Rolo } from "./types"
import { formatarData, formatarMetragem, formatarPeso } from "./utils"

export function loadImage(url: string): Promise<HTMLImageElement | null> {
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

export async function carregarEmpresa(): Promise<{
  empresa: Record<string, any> | null
  logoImg: HTMLImageElement | null
}> {
  try {
    const res = await fetch("/api/admin/config/empresa")
    const list = await res.json()
    const empresa = list.find((e: any) => e.isDefault) || list[0]
    let logoImg: HTMLImageElement | null = null
    if (empresa?.logoUrl) {
      logoImg = await loadImage(empresa.logoUrl)
    }
    return { empresa, logoImg }
  } catch {
    return { empresa: null, logoImg: null }
  }
}

export async function criarDocPdf(orient: OrientacaoPdf) {
  const { default: jsPDF } = await import("jspdf")
  await import("jspdf-autotable")
  const doc = new jsPDF(orient)
  const isLandscape = orient === "landscape"
  const pageWidth = doc.internal.pageSize.getWidth()
  return { doc, isLandscape, pageWidth }
}

export async function renderRomaneioPage(
  doc: any,
  grupo: GrupoRomaneio,
  numero: number,
  isLandscape: boolean,
  pageWidth: number,
  empresa: Record<string, any> | null,
  logoImg: HTMLImageElement | null
) {
  const margin = 8
  let y = margin

  if (empresa) {
    const headerH = isLandscape ? 30 : 28
    doc.setFillColor(7, 63, 184)
    doc.rect(0, 0, pageWidth, headerH, "F")
    if (logoImg) {
      const maxW = isLandscape ? 35 : 30
      const maxH = isLandscape ? 18 : 15
      const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1)
      doc.addImage(logoImg, "PNG", margin, y + 2, logoImg.width * scale, logoImg.height * scale)
    }
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(isLandscape ? 13 : 12).setFont("helvetica", "bold")
    doc.text(empresa.nome || "", isLandscape ? 48 : 42, y + 4)
    doc.setFontSize(isLandscape ? 9 : 8.5).setFont("helvetica", "normal")
    let yOff = y + 8
    if (empresa.documento) { doc.text(`CNPJ: ${empresa.documento}`, isLandscape ? 48 : 42, yOff); yOff += 3.5 }
    if (empresa.endereco) { doc.text(empresa.endereco, isLandscape ? 48 : 42, yOff); yOff += 3.5 }
    if (empresa.cidade || empresa.uf) { doc.text([empresa.cidade, empresa.uf].filter(Boolean).join("/"), isLandscape ? 48 : 42, yOff) }
    doc.setTextColor(0, 0, 0)
    y = headerH + (isLandscape ? 6 : 5)
  } else {
    y = isLandscape ? 18 : 16
  }

  const barTop = y - 4
  const tituloH = 11
  doc.setFillColor(7, 63, 184)
  doc.roundedRect(margin, barTop, pageWidth - margin * 2, tituloH, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(isLandscape ? 14 : 12).setFont("helvetica", "bold")
  doc.text(`Romaneio Nº ${numero}`, margin + 3, barTop + tituloH / 2 + 1.5)
  doc.setTextColor(0, 0, 0)

  const c = grupo.capa
  y += isLandscape ? 6 : 5

  const fsTit = isLandscape ? 8 : 7.5
  const fsVal = isLandscape ? 7.5 : 7
  const linha1 = isLandscape ? 10 : 10
  const linha2 = isLandscape ? 15 : 16
  const linha3 = isLandscape ? 20 : 22
  const linha4 = isLandscape ? 25 : 28
  const capaH = isLandscape ? 42 : 54
  const col1 = margin + 4
  const col2 = isLandscape ? 90 : 82
  const col3 = isLandscape ? 160 : 125
  const col4 = isLandscape ? 215 : 170

  doc.setDrawColor(200)
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, pageWidth - margin * 2, capaH, 2, 2, "FD")

  // --- Row: CLIENTE | REPRESENTANTE ---
  doc.setFontSize(fsTit).setFont("helvetica", "bold")
  doc.text("CLIENTE", col1, y + 4)
  doc.setFont("helvetica", "normal").setFontSize(fsVal)
  const textoCliente = doc.splitTextToSize(`${c.nome_cliente}`, col2 - col1 - 8)
  doc.text(textoCliente, col1, y + linha1)
  doc.text(`CNPJ: ${c.cnpj}`, col1, y + linha2)
  doc.text(`${c.cidade} / ${c.uf}`, col1, y + linha3)
  doc.text(`${c.fantasia}`, col1, y + linha4)

  doc.setFont("helvetica", "bold").setFontSize(fsTit)
  doc.text("REPRESENTANTE", col2, y + 4)
  doc.setFont("helvetica", "normal").setFontSize(fsVal)
  doc.text(`${c.nome_represenante}`, col2, y + linha1)
  doc.text(`Região: ${c.nome_regiao}`, col2, y + linha2)

  // --- Row: PEDIDO (below CLIENTE/REPRESENTANTE) ---
  const pedidoY = y + linha4 + (isLandscape ? 5 : 8)
  doc.setDrawColor(200)
  doc.setFillColor(235, 240, 248)
  const pedidoBoxX = margin + 2
  const pedidoBoxW = pageWidth - margin * 2 - 4
  doc.roundedRect(pedidoBoxX, pedidoY - 1, pedidoBoxW, isLandscape ? 10 : 14, 1, 1, "FD")
  doc.setFont("helvetica", "bold").setFontSize(fsTit)
  doc.text("PEDIDO", col1, pedidoY + (isLandscape ? 4 : 6))
  doc.setFont("helvetica", "normal").setFontSize(fsVal)
  doc.text(`Nº ${c.pedido}`, col2, pedidoY + (isLandscape ? 4 : 6))
  doc.text(`Emissão: ${formatarData(c.emissao)}`, col3, pedidoY + (isLandscape ? 4 : 6))
  doc.text(`Entrega: ${formatarData(c.entrega)}`, col4, pedidoY + (isLandscape ? 4 : 6))

  // --- TOTAIS (right side, same row as CLIENTE) ---
  doc.setFont("helvetica", "bold").setFontSize(fsTit)
  doc.text("TOTAIS", col4, y + 4)
  doc.setFont("helvetica", "bold").setFontSize(fsVal)
  doc.text(`${grupo.totalRolos} rolo(s)`, col4, y + linha1)
  doc.text(`Metragem: ${formatarMetragem(grupo.totalMetragem)}`, col4, y + linha2)
  doc.text(`P. Bruto: ${formatarPeso(grupo.totalPesoBruto)}`, col4, y + linha3)
  doc.text(`P. Líquido: ${formatarPeso(grupo.totalPesoLiquido)}`, col4, y + linha4)

  y += capaH + 6

  // Agrupar rolos por produto, depois por lote_produto
  const produtosMap = new Map<string, Map<string, Rolo[]>>()
  for (const r of grupo.rolos) {
    const prodNome = r.produto || "SEM PRODUTO"
    const loteNome = r.lote_produto || "SEM LOTE"
    if (!produtosMap.has(prodNome)) produtosMap.set(prodNome, new Map())
    const lotesMap = produtosMap.get(prodNome)!
    if (!lotesMap.has(loteNome)) lotesMap.set(loteNome, [])
    lotesMap.get(loteNome)!.push(r)
  }
  const produtosOrdenados = Array.from(produtosMap.entries()).sort((a: any, b: any) => a[0].localeCompare(b[0]))

  const head = [
    ["#", "Cód. Rolo", "Produto", "Narrativa", "Lote", "Metragem", "P. Bruto", "P. Líquido", "Largura", "Endereço"],
  ]
  const body: any[] = []

  for (const [prodNome, lotesMap] of produtosOrdenados) {
    const lotesOrdenados = Array.from(lotesMap.entries()).sort((a: any, b: any) => a[0].localeCompare(b[0]))

    let prodRolos = 0
    let prodMetragem = 0
    let prodPesoBruto = 0
    let prodPesoLiquido = 0

    body.push([
      {
        content: `PRODUTO: ${prodNome}`,
        colSpan: 10,
        styles: { fillColor: [233, 213, 255], fontStyle: "bold", fontSize: isLandscape ? 6.5 : 6, halign: "left" },
      },
    ])

    for (const [loteNome, rolos] of lotesOrdenados) {
      const subRolos = rolos.length
      let subMetragem = 0
      let subPesoBruto = 0
      let subPesoLiquido = 0
      for (const r of rolos) {
        subMetragem += r.quantidade || 0
        subPesoBruto += r.peso_bruto || 0
        subPesoLiquido += r.peso_liquido || 0
      }

      prodRolos += subRolos
      prodMetragem += subMetragem
      prodPesoBruto += subPesoBruto
      prodPesoLiquido += subPesoLiquido

      body.push([
        {
          content: `LOTE ${loteNome}`,
          colSpan: 10,
          styles: { fillColor: [219, 234, 254], fontStyle: "bold", fontSize: isLandscape ? 6.5 : 6, halign: "left" },
        },
      ])

      rolos.forEach((r: any, idx: any) => {
        body.push([
          String(idx + 1),
          String(r.codigo_rolo),
          r.produto || "—",
          r.narrativa || "—",
          r.lote_produto || "—",
          formatarMetragem(r.quantidade),
          formatarPeso(r.peso_bruto),
          formatarPeso(r.peso_liquido),
          r.largura ? `${r.largura.toFixed(1)} m` : "—",
          r.endereco_rolo || "—",
        ])
      })

      body.push([
        { content: "", colSpan: 3, styles: { fillColor: [245, 247, 250] } },
        { content: `${subRolos} rolo(s)`, styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "left" } },
        { content: "", styles: { fillColor: [245, 247, 250] } },
        { content: formatarMetragem(subMetragem), styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "right" } },
        { content: formatarPeso(subPesoBruto), styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "right" } },
        { content: formatarPeso(subPesoLiquido), styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "right" } },
        { content: "", colSpan: 2, styles: { fillColor: [245, 247, 250] } },
      ])
    }

    body.push([
      { content: `SUBTOTAL ${prodNome}: ${prodRolos} rolo(s)`, colSpan: 5, styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255] } },
      { content: formatarMetragem(prodMetragem), styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255], halign: "right" } },
      { content: formatarPeso(prodPesoBruto), styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255], halign: "right" } },
      { content: formatarPeso(prodPesoLiquido), styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255], halign: "right" } },
      { content: "", colSpan: 2, styles: { fillColor: [233, 213, 255] } },
    ])
  }

  body.push([
    { content: `TOTAL GERAL: ${grupo.totalRolos} rolo(s)`, colSpan: 5, styles: { fontStyle: "bold", fontSize: isLandscape ? 9 : 8, fillColor: [191, 219, 254] } },
    { content: formatarMetragem(grupo.totalMetragem), styles: { fontStyle: "bold", fontSize: isLandscape ? 9 : 8, fillColor: [191, 219, 254], halign: "right" } },
    { content: formatarPeso(grupo.totalPesoBruto), styles: { fontStyle: "bold", fontSize: isLandscape ? 9 : 8, fillColor: [191, 219, 254], halign: "right" } },
    { content: formatarPeso(grupo.totalPesoLiquido), styles: { fontStyle: "bold", fontSize: isLandscape ? 9 : 8, fillColor: [191, 219, 254], halign: "right" } },
    { content: "", colSpan: 2, styles: { fillColor: [191, 219, 254] } },
  ])

  const fontSize = isLandscape ? 7.5 : 7
  const pageH = doc.internal.pageSize.getHeight()
  ;(doc as any).autoTable({
    head,
    body,
    startY: y,
    styles: { fontSize, cellPadding: isLandscape ? 1.5 : 1.2 },
    headStyles: { fillColor: [7, 63, 184], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 10, left: margin, right: margin, bottom: isLandscape ? 10 : 9 },
    tableLineColor: 200,
    tableLineWidth: 0.5,
    columnStyles: {
      0: { cellWidth: isLandscape ? 10 : 8, halign: "center" },
      4: { halign: "center" },
      8: { halign: "center" },
      9: { halign: "center" },
    },
    didDrawPage: (data: any) => {
      doc.setFontSize(isLandscape ? 6.5 : 6).setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)
      doc.text(`Romaneio Nº ${numero}`, margin, pageH - (isLandscape ? 6 : 5))
      doc.text(`Página ${data.pageNumber}`, pageWidth - margin, pageH - (isLandscape ? 6 : 5), { align: "right" })
      doc.setTextColor(0, 0, 0)
    },
  })
}

export async function gerarPdfRomaneio(grupo: GrupoRomaneio, orient: OrientacaoPdf): Promise<void> {
  const { doc, isLandscape, pageWidth } = await criarDocPdf(orient)
  const { empresa, logoImg } = await carregarEmpresa()
  await renderRomaneioPage(doc, grupo, grupo.romaneio, isLandscape, pageWidth, empresa, logoImg)
  doc.save(`romaneio-${grupo.romaneio}.pdf`)
}

export async function gerarPdfRomaneioConsolidado(
  grupos: GrupoRomaneio[],
  nums: number[],
  orient: OrientacaoPdf
): Promise<void> {
  const { doc, isLandscape, pageWidth } = await criarDocPdf(orient)
  const { empresa, logoImg } = await carregarEmpresa()
  for (let i = 0; i < nums.length; i++) {
    const grupo = grupos.find((g: any) => g.romaneio === nums[i])
    if (!grupo) continue
    if (i > 0) doc.addPage()
    await renderRomaneioPage(doc, grupo, nums[i], isLandscape, pageWidth, empresa, logoImg)
  }
  const sufixo = nums.length <= 3 ? nums.join("-") : `${nums[0]}-${nums[nums.length - 1]}`
  doc.save(`romaneios-${sufixo}.pdf`)
}
