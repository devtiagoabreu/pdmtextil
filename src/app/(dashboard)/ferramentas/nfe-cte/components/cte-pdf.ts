import type { jsPDF } from "jspdf"
import type { GrupoCte, LinhaCte } from "./types"
import {
  classificarFaixaFrete,
  formatarMoeda,
  formatarPercentual,
  freteCte,
  nomeClienteNf,
} from "./utils"

/** Orientações aceitas — espelha `OrientacaoPdf` do romaneio. */
export type OrientacaoCtePdf = "portrait" | "landscape"

interface EmpresaConfig {
  nome?: string
  documento?: string
  endereco?: string
  cidade?: string
  uf?: string
  logoUrl?: string
  isDefault?: boolean
}

type CelulaTabela = {
  content: string
  colSpan?: number
  styles?: Record<string, unknown>
}

type LinhaTabela = (string | CelulaTabela)[]

/** jspdf-autotable não augmenta o tipo do jsPDF → cast local, sem `any`. */
type DocPdfComAutoTable = jsPDF & { autoTable: (options: Record<string, unknown>) => unknown }

const AZUL: [number, number, number] = [7, 63, 184]
const CINZA_CINTO: [number, number, number] = [245, 247, 250]

export function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => {
      // O logo em URL externa costuma estar sem CORS; o proxy evita o canvas
      // sujo que quebraria o addImage.
      const img2 = new Image()
      img2.crossOrigin = "anonymous"
      img2.onload = () => resolve(img2)
      img2.onerror = () => resolve(null)
      img2.src = `/api/proxy-image?url=${encodeURIComponent(url)}`
    }
    img.src = url
  })
}

export async function carregarEmpresa(): Promise<{
  empresa: EmpresaConfig | null
  logoImg: HTMLImageElement | null
}> {
  try {
    const res = await fetch("/api/admin/config/empresa")
    const list = (await res.json()) as EmpresaConfig[]
    const empresa = list.find((e) => e.isDefault) || list[0] || null
    const logoImg = empresa?.logoUrl ? await loadImage(empresa.logoUrl) : null
    return { empresa, logoImg }
  } catch {
    return { empresa: null, logoImg: null }
  }
}

export async function criarDocCtePdf(orient: OrientacaoCtePdf) {
  // Import dinâmico: jspdf (~350 kB) só entra no bundle quando o usuário
  // realmente pede o PDF.
  const { default: jsPDF } = await import("jspdf")
  await import("jspdf-autotable")
  const doc = new jsPDF(orient)
  return {
    doc,
    isLandscape: orient === "landscape",
    pageWidth: doc.internal.pageSize.getWidth(),
  }
}

function rotuloCte(grupo: GrupoCte): string {
  const numero = grupo.numero == null ? "?" : grupo.numero
  return `${numero}/${grupo.serie ?? ""}`.replace(/\/$/, "")
}

function cidade(n: number | null): string {
  return n == null ? "—" : String(n)
}

/** Primeira linha não vazia do campo, para manter os boxes do PDF enxutos. */
function primeiro(...valores: (string | null | undefined)[]): string {
  for (const v of valores) {
    const t = (v ?? "").trim()
    if (t) return t
  }
  return "—"
}

function rotuloFaixa(pct: number | null): string {
  switch (classificarFaixaFrete(pct)) {
    case "abaixo":
      return "até 1,5%"
    case "na_faixa":
      return "na faixa"
    case "acima":
      return "acima de 2,0%"
    default:
      return "sem dado"
  }
}

/**
 * Desenha uma página com um CT-e: cabeçalho da empresa, barra de título, box de
 * identificação e a grade das NF-e rateadas.
 */
export async function renderCtePage(
  doc: jsPDF,
  grupo: GrupoCte,
  indice: number,
  total: number,
  isLandscape: boolean,
  pageWidth: number,
  empresa: EmpresaConfig | null,
  logoImg: HTMLImageElement | null
): Promise<void> {
  const margin = 8
  let y = margin

  if (empresa) {
    const headerH = isLandscape ? 30 : 28
    doc.setFillColor(...AZUL)
    doc.rect(0, 0, pageWidth, headerH, "F")
    if (logoImg) {
      const escala = Math.min(30 / logoImg.width, 15 / logoImg.height, 1)
      doc.addImage(logoImg, "PNG", margin, y + 2, logoImg.width * escala, logoImg.height * escala)
    }
    doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(12)
    doc.text(primeiro(empresa.nome), 42, y + 4)
    doc.setFont("helvetica", "normal").setFontSize(8.5)
    let yOff = y + 8
    if (empresa.documento) {
      doc.text(`CNPJ: ${empresa.documento}`, 42, yOff)
      yOff += 3.5
    }
    if (empresa.endereco) {
      doc.text(empresa.endereco, 42, yOff)
      yOff += 3.5
    }
    const cidadeUf = [empresa.cidade, empresa.uf].filter(Boolean).join("/")
    if (cidadeUf) doc.text(cidadeUf, 42, yOff)
    doc.setTextColor(0, 0, 0)
    y = headerH + 5
  } else {
    y = 16
  }

  const tituloH = 11
  const barTop = y - 4
  doc.setFillColor(...AZUL)
  doc.roundedRect(margin, barTop, pageWidth - margin * 2, tituloH, 2, 2, "F")
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(12)
  doc.text(`CT-e Nº ${rotuloCte(grupo)}`, margin + 3, barTop + tituloH / 2 + 1.5)
  doc.setTextColor(0, 0, 0)
  y += 5

  // ── Box de identificação: dados do CT-e à esquerda, totais à direita ──
  const fsTit = 7.5
  const fsVal = 7
  const boxH = 38
  const col1 = margin + 4
  const col2 = isLandscape ? 95 : 85
  const colDireita = isLandscape ? pageWidth - margin - 62 : pageWidth - margin - 58
  doc.setDrawColor(200).setFillColor(...CINZA_CINTO)
  doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 2, 2, "FD")

  doc.setFont("helvetica", "bold").setFontSize(fsTit)
  doc.text("TRANSPORTADORA", col1, y + 4)
  doc.text("REGIÃO DO CLIENTE", col2, y + 4)
  doc.setFont("helvetica", "normal").setFontSize(fsVal)
  doc.text(doc.splitTextToSize(grupo.transportadora, col2 - col1 - 8), col1, y + 10)
  doc.text(grupo.regiao, col2, y + 10)

  doc.setFont("helvetica", "bold").setFontSize(fsTit)
  doc.text("DADOS DO CT-e", col1, y + 19)
  doc.setFont("helvetica", "normal").setFontSize(fsVal)
  doc.text(
    doc.splitTextToSize(
      `Emissão: ${grupo.data ?? "—"} · Transação: ${grupo.dataTransacao ?? "—"}\n` +
        `Origem: ${cidade(grupo.codCidadeOrigem)} · Destino: ${cidade(grupo.codCidadeDestino)} · ` +
        `Natureza: ${grupo.natureza ?? "—"} · Situação: ${grupo.situacao ?? "—"}`,
      pageWidth - margin * 2 - 10
    ),
    col1,
    y + 25
  )

  doc.setFont("helvetica", "bold").setFontSize(fsTit)
  doc.text("TOTAIS", colDireita, y + 4)
  doc.setFontSize(fsVal)
  const pct = grupo.pctSobreNf ?? grupo.pctCalculado
  doc.text(`${grupo.nfs.length} NF-e`, colDireita, y + 10)
  doc.text(`Mercadoria: ${formatarMoeda(grupo.somaNf ?? grupo.somaNfCalculada)}`, colDireita, y + 14.5)
  doc.text(`Frete: ${formatarMoeda(freteCte(grupo))}`, colDireita, y + 19)
  doc.text(`Rateio: ${formatarMoeda(grupo.somaRateio ?? grupo.somaRateioCalculada)}`, colDireita, y + 23.5)
  doc.text(`% CT-e: ${formatarPercentual(pct)} (${rotuloFaixa(pct)})`, colDireita, y + 28)

  y += boxH + 6

  // ── Grade das NF-e rateadas ──
  const head: LinhaTabela[] = [
    ["NF-e", "Emissão", "Cliente", "Valor da nota", "Rateio", "% do CT-e", "% da nota", "Romaneio"]
  ]
  const body: LinhaTabela[] = grupo.nfs.map((n) => linhaNf(n))

  const pageH = doc.internal.pageSize.getHeight()
  ;(doc as DocPdfComAutoTable).autoTable({
    head,
    body,
    startY: y,
    styles: { fontSize: 7, cellPadding: 1.4 },
    headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: CINZA_CINTO },
    margin: { top: 10, left: margin, right: margin, bottom: 10 },
    tableLineColor: 200,
    tableLineWidth: 0.5,
    columnStyles: {
      0: { cellWidth: 26, halign: "center" },
      1: { cellWidth: 18 },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "center" },
    },
    didDrawPage: (data: { pageNumber: number }) => {
      doc.setFontSize(6.5).setFont("helvetica", "normal").setTextColor(0, 0, 0)
      doc.text(`CT-e Nº ${rotuloCte(grupo)}`, margin, pageH - 6)
      doc.text(
        `NF-e ${indice} de ${total} · Página ${data.pageNumber}`,
        pageWidth - margin,
        pageH - 6,
        { align: "right" }
      )
    },
  })

  // Totais no fim da tabela — só faz sentido quando ela cabe numa página.
  const fim = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  if (fim < pageH - 20) {
    doc.setFont("helvetica", "bold").setFontSize(7.5)
    doc.text(
      `Total: ${grupo.nfs.length} NF-e · mercadoria ${formatarMoeda(grupo.somaNf ?? grupo.somaNfCalculada)}` +
        ` · frete ${formatarMoeda(freteCte(grupo))}`,
      margin,
      fim + 5
    )
  }
}

function linhaNf(n: LinhaCte): LinhaTabela {
  const nf = `${n.nf_numero ?? "?"}/${n.nf_serie ?? ""}`.replace(/\/$/, "")
  return [
    nf,
    n.nf_data ?? "—",
    nomeClienteNf(n) ?? "—",
    formatarMoeda(n.nf_item_valor_total),
    formatarMoeda(n.nf_frete_rateado),
    formatarPercentual(n.nf_pct_rateio_no_cte),
    formatarPercentual(n.pct_nf_no_total_cte),
    n.nf_od_romaneio == null ? "—" : String(n.nf_od_romaneio)
  ]
}

/** PDF de um CT-e só. */
export async function gerarPdfCte(
  grupo: GrupoCte,
  orient: OrientacaoCtePdf
): Promise<void> {
  const { doc, isLandscape, pageWidth } = await criarDocCtePdf(orient)
  const { empresa, logoImg } = await carregarEmpresa()
  await renderCtePage(doc, grupo, 1, 1, isLandscape, pageWidth, empresa, logoImg)
  doc.save(`cte-${grupo.numero ?? "sem-numero"}.pdf`)
}

/**
 * PDF consolidado: uma página por CT-e selecionado. É o mesmo desenho do
 * "Consolidado" do romaneio, e o nome do arquivo segue a mesma convenção
 * (lista curta → números; lista longa → faixa do primeiro ao último).
 */
export async function gerarPdfCtes(
  grupos: GrupoCte[],
  orient: OrientacaoCtePdf
): Promise<void> {
  if (grupos.length === 0) return
  const { doc, isLandscape, pageWidth } = await criarDocCtePdf(orient)
  const { empresa, logoImg } = await carregarEmpresa()
  for (let i = 0; i < grupos.length; i++) {
    if (i > 0) doc.addPage()
    await renderCtePage(doc, grupos[i], i + 1, grupos.length, isLandscape, pageWidth, empresa, logoImg)
  }
  doc.save(`ctes-${sufixoArquivo(grupos)}.pdf`)
}

/** `ctes-195476.pdf`, `ctes-195476-195480.pdf` ou `ctes-195476-195520.pdf`. */
export function sufixoArquivo(grupos: GrupoCte[]): string {
  const nums = grupos.map((g) => g.numero).filter((n): n is number => n != null)
  if (nums.length === 0) return "selecao"
  const ordenados = [...nums].sort((a, b) => a - b)
  return ordenados.length <= 3
    ? ordenados.join("-")
    : `${ordenados[0]}-${ordenados[ordenados.length - 1]}`
}