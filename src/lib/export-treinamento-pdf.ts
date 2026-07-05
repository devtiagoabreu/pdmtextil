"use client"

import jsPDF from "jspdf"
import "jspdf-autotable"

type LicaoData = {
  id: number
  titulo: string
  conteudoMd: string
  preRequisitos: string | null
  ordem: number
  ativo: boolean
}

type ModuloData = {
  id: number
  titulo: string
  descricao: string | null
  icone: string | null
  cor: string | null
  ordem: number
  ativo: boolean
  licoes: LicaoData[]
}

type TocItem = {
  titulo: string
  pageNum: number
  subItems?: TocItem[]
}

const MARGIN_TOP = 35
const MARGIN_BOTTOM = 30
const MARGIN_LEFT = 25
const MARGIN_RIGHT = 25
const FONT_SIZE_BODY = 10
const LINE_HEIGHT = 5.5
const PARAGRAPH_SPACE = 3
const SECTION_SPACE = 4

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function sanitizeText(text: string): string {
  let t = text
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2191/g, "^")
    .replace(/\u2193/g, "v")
    .replace(/[\u{2500}-\u{257F}]/gu, "")
    .replace(/[\u{2580}-\u{259F}]/gu, "")
    .replace(/[\u{25A0}-\u{25FF}]/gu, "")
    .replace(/\u{00AB}/gu, '"')
    .replace(/\u{00BB}/gu, '"')
    .replace(/[\u{2010}-\u{2015}]/gu, "-")
    .replace(/[\u{2018}\u{2019}]/gu, "'")
    .replace(/[\u{201C}\u{201D}]/gu, '"')
    .replace(/\u{2026}/gu, "...")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{2300}-\u{23FF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .replace(/[\u{2934}\u{2935}]/gu, "")
    .replace(/[\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}\u{25FC}\u{25FD}\u{25FE}]/gu, "")
    .replace(/[\u{2B05}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}]/gu, "")
    .replace(/[\u{3030}\u{303D}\u{3297}\u{3299}]/gu, "")
    .replace(/\ufe0f/gu, "")
  return t.trim()
}

class TreinamentoPdfRenderer {
  private doc: jsPDF
  private pw: number
  private ph: number
  private cw: number
  private ch: number
  y: number
  private pageNum = 1
  private headerLeft = ""
  private headerRight = ""
  private tocItems: TocItem[] = []
  private inToc = false
  private tocPageStart = 0
  private tocY: number[] = []

  constructor() {
    this.doc = new jsPDF("p", "mm", "a4")
    this.pw = this.doc.internal.pageSize.getWidth()
    this.ph = this.doc.internal.pageSize.getHeight()
    this.cw = this.pw - MARGIN_LEFT - MARGIN_RIGHT
    this.ch = this.ph - MARGIN_TOP - MARGIN_BOTTOM
    this.y = MARGIN_TOP

    this.doc.setFont("helvetica", "normal")
  }

  private addFooter() {
    const footerY = this.ph - MARGIN_BOTTOM + 8
    this.doc.setFontSize(8)
    this.doc.setTextColor(120, 120, 120)
    this.doc.setFont("helvetica", "normal")

    this.doc.line(MARGIN_LEFT, footerY - 4, this.pw - MARGIN_RIGHT, footerY - 4)

    const leftText = this.headerLeft || "PDM Têxtil — Treinamento CRM"
    this.doc.text(leftText, MARGIN_LEFT, footerY, { align: "left" })

    this.doc.text(String(this.pageNum), this.pw / 2, footerY, { align: "center" })

    const dataStr = new Date().toLocaleDateString("pt-BR")
    this.doc.text(dataStr, this.pw - MARGIN_RIGHT, footerY, { align: "right" })
    this.doc.setTextColor(0, 0, 0)
  }

  private addHeader() {
    const headerY = MARGIN_TOP - 10
    this.doc.setFontSize(8)
    this.doc.setTextColor(100, 100, 100)
    this.doc.setFont("helvetica", "normal")

    this.doc.line(MARGIN_LEFT, headerY + 4, this.pw - MARGIN_RIGHT, headerY + 4)

    this.doc.text("PDM Têxtil — Treinamento CRM", MARGIN_LEFT, headerY, { align: "left" })

    if (this.headerRight) {
      this.doc.text(this.headerRight, this.pw - MARGIN_RIGHT, headerY, { align: "right" })
    }
    this.doc.setTextColor(0, 0, 0)
  }

  private checkPageBreak(needed: number) {
    if (this.y + needed > MARGIN_TOP + this.ch) {
      this.addFooter()
      this.doc.addPage()
      this.pageNum++
      this.y = MARGIN_TOP
      this.addHeader()
    }
  }

  private measureTextHeight(text: string, fontSize: number, maxWidth?: number): number {
    const w = maxWidth || this.cw
    const savedSize = this.doc.getFontSize()
    this.doc.setFontSize(fontSize)
    const lines = this.doc.splitTextToSize(text, w)
    const h = lines.length * (fontSize * 0.3528 * 1.5)
    this.doc.setFontSize(savedSize)
    return h
  }

  private stripMarkdown(text: string): string {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
  }

  private renderInlineText(text: string, x: number, y: number, maxWidth?: number, opts?: {
    fontSize?: number
    bold?: boolean
    italic?: boolean
    color?: [number, number, number]
  }) {
    const w = maxWidth || this.cw
    const fs = opts?.fontSize || FONT_SIZE_BODY
    this.doc.setFontSize(fs)

    if (opts?.bold) this.doc.setFont("helvetica", "bold")
    else if (opts?.italic) this.doc.setFont("helvetica", "italic")
    else this.doc.setFont("helvetica", "normal")

    if (opts?.color) this.doc.setTextColor(...opts.color)

    const lines = this.doc.splitTextToSize(sanitizeText(this.stripMarkdown(text)), w)
    this.doc.text(lines, x, y, { align: "left" })

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    return lines.length * (fs * 0.3528 * 1.5)
  }

  private renderParagraph(text: string) {
    const clean = sanitizeText(this.stripMarkdown(text.trim()))
    if (!clean) return

    const fs = FONT_SIZE_BODY
    const lh = fs * 0.3528 * 1.5

    const lines = this.doc.splitTextToSize(clean, this.cw)
    const totalH = lines.length * lh + PARAGRAPH_SPACE

    this.checkPageBreak(totalH)

    this.doc.setFontSize(fs)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(lines, MARGIN_LEFT, this.y + lh * 0.75, { align: "left" })

    this.y += lines.length * lh + PARAGRAPH_SPACE
  }

  private renderHeading(text: string, level: number) {
    const sizes = { 1: 18, 2: 14, 3: 12 }
    const fs = sizes[level as keyof typeof sizes] || 12
    const lh = fs * 0.3528 * 1.5
    const space = level === 1 ? 8 : level === 2 ? 6 : 4

    const cleanText = sanitizeText(text.replace(/^#+\s*/, "").trim())
    const cleanDisplay = cleanText.replace(/^\*\*(.+)\*\*\s*/, "$1 ")

    const h = lh + space
    this.checkPageBreak(h + 2)

    if (level === 2) {
      this.doc.setDrawColor(99, 102, 241)
      this.doc.setLineWidth(0.3)
      this.doc.line(MARGIN_LEFT, this.y - 1, this.pw - MARGIN_RIGHT, this.y - 1)
    }

    this.renderInlineText(cleanDisplay, MARGIN_LEFT, this.y + lh * 0.75, this.cw, {
      fontSize: fs,
      bold: true,
      color: level === 1 ? [30, 30, 30] : level === 2 ? [99, 102, 241] : [60, 60, 60],
    })

    this.y += h
  }

  private renderList(items: string[], ordered: boolean) {
    const cleaned = items.map((item) => sanitizeText(this.stripMarkdown(item)))
    const fs = FONT_SIZE_BODY
    const lh = fs * 0.3528 * 1.5
    const indent = 6
    let totalH = 0

    const renderedItems: { prefix: string; lines: string[] }[] = []
    for (let i = 0; i < cleaned.length; i++) {
      const prefix = ordered ? `${i + 1}. ` : "- "
      const lines = this.doc.splitTextToSize(prefix + cleaned[i], this.cw - indent)
      totalH += lines.length * lh + 2
      renderedItems.push({ prefix, lines })
    }

    this.checkPageBreak(totalH)

    for (const item of renderedItems) {
      const h = item.lines.length * lh
      this.checkPageBreak(h + 2)
      this.doc.setFontSize(fs)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(item.lines, MARGIN_LEFT + indent, this.y + lh * 0.75, { align: "left" })
      this.y += h + 2
    }
  }

  private renderTable(mdLines: string[]) {
    if (mdLines.length < 2) return

    const clean = (s: string) => sanitizeText(this.stripMarkdown(s.trim()))
    const headerCells = mdLines[0].split("|").filter(Boolean).map(clean)
    const dataRows = mdLines.slice(2).map((line) =>
      line.split("|").filter(Boolean).map(clean)
    )

    if (headerCells.length === 0) return

    const colWidth = this.cw / headerCells.length

    let h = 10 + dataRows.length * 6

    const savedY = this.y
    this.checkPageBreak(h + 10)

    ;(this.doc as any).autoTable({
      head: [headerCells],
      body: dataRows,
      startY: this.y,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 2,
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
        textColor: [40, 40, 40],
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: Object.fromEntries(
        headerCells.map((_, i) => [i, { cellWidth: colWidth }])
      ),
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      didDrawPage: (data: any) => {
        this.pageNum = data.pageNumber
        this.addHeader()
      },
    })

    this.y = (this.doc as any).lastAutoTable.finalY + PARAGRAPH_SPACE
  }

  private renderCodeBlock(code: string) {
    const fs = 8
    const lh = fs * 0.3528 * 1.4
    const lines = sanitizeText(code).split("\n")
    const h = lines.length * lh + 8

    this.checkPageBreak(h + 4)

    const blockX = MARGIN_LEFT + 3
    const blockW = this.cw - 6

    this.doc.setFillColor(240, 242, 245)
    this.doc.rect(blockX - 1, this.y - 2, blockW + 2, h + 2, "F")
    this.doc.setDrawColor(200, 200, 210)
    this.doc.rect(blockX - 1, this.y - 2, blockW + 2, h + 2, "S")

    this.doc.setFont("courier", "normal")
    this.doc.setFontSize(fs)
    this.doc.setTextColor(60, 60, 70)

    for (let i = 0; i < lines.length; i++) {
      this.doc.text(lines[i], blockX + 1, this.y + lh * 0.75)
      this.y += lh
    }

    this.doc.setFont("helvetica", "normal")
    this.doc.setTextColor(0, 0, 0)
    this.y += PARAGRAPH_SPACE
  }

  private renderBlockquote(text: string) {
    const fs = FONT_SIZE_BODY
    const lh = fs * 0.3528 * 1.5

    const cleanText = sanitizeText(this.stripMarkdown(text.replace(/^>\s*/, "").trim()))
    const lines = this.doc.splitTextToSize(cleanText, this.cw - 10)
    const h = lines.length * lh + 6

    this.checkPageBreak(h + 6)

    this.doc.setFillColor(238, 240, 255)
    this.doc.rect(MARGIN_LEFT - 2, this.y - 1, this.cw + 4, h, "F")
    this.doc.setDrawColor(99, 102, 241)
    this.doc.setLineWidth(1.2)
    this.doc.line(MARGIN_LEFT - 2, this.y - 1, MARGIN_LEFT - 2, this.y + h)

    this.doc.setTextColor(80, 80, 90)
    this.doc.setFont("helvetica", "italic")
    this.doc.setFontSize(fs)
    this.doc.text(lines, MARGIN_LEFT + 3, this.y + lh * 0.75, { align: "left" })

    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "normal")
    this.y += h + 6
  }

  private renderImage(alt: string, url: string) {
    const maxW = this.cw * 0.7
    const maxH = 60
    this.checkPageBreak(maxH + 10)

    this.doc.setFontSize(8)
    this.doc.setTextColor(140, 140, 140)

    const label = `[Imagem: ${alt || "ilustração"}]`
    const lines = this.doc.splitTextToSize(label, maxW)
    this.doc.text(lines, this.pw / 2, this.y + 4, { align: "center" })

    this.doc.text(`(${url})`, this.pw / 2, this.y + (lines.length + 1) * 3.5 + 4, {
      align: "center",
    })

    this.doc.setTextColor(0, 0, 0)
    this.y += lines.length * 3.5 + 12
  }

  private renderHorizontalRule() {
    this.checkPageBreak(4)
    this.y += 2
    this.doc.setDrawColor(180, 180, 190)
    this.doc.setLineWidth(0.3)
    this.doc.line(MARGIN_LEFT, this.y, this.pw - MARGIN_RIGHT, this.y)
    this.y += 4
  }

  private renderPrerequisito(text: string) {
    const cleanText = sanitizeText(text)
    const fs = 9
    const lh = fs * 0.3528 * 1.5
    const h = this.measureTextHeight(cleanText, fs, this.cw - 8) + 8
    this.checkPageBreak(h)

    this.doc.setFillColor(255, 248, 230)
    this.doc.rect(MARGIN_LEFT - 1, this.y - 1, this.cw + 2, h, "F")
    this.doc.setDrawColor(230, 190, 130)
    this.doc.rect(MARGIN_LEFT - 1, this.y - 1, this.cw + 2, h, "S")

    this.doc.setFont("helvetica", "bold")
    this.doc.setFontSize(fs)
    this.doc.setTextColor(140, 90, 10)
    this.doc.text("Pre-cadastros Necessarios:", MARGIN_LEFT + 2, this.y + lh * 0.75)

    this.doc.setFont("helvetica", "normal")
    const lines = this.doc.splitTextToSize(cleanText, this.cw - 8)
    this.doc.text(lines, MARGIN_LEFT + 2, this.y + lh * 0.75 + lh + 2)

    this.doc.setTextColor(0, 0, 0)
    this.y += h + 4
  }

  renderMarkdown(md: string) {
    const lines = md.split("\n")
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      if (line.startsWith("```")) {
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i])
          i++
        }
        if (codeLines.length > 0) this.renderCodeBlock(codeLines.join("\n"))
        i++
        continue
      }

      if (line.startsWith("|") && line.endsWith("|")) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].startsWith("|")) {
          tableLines.push(lines[i])
          i++
        }
        this.renderTable(tableLines)
        continue
      }

      if (line.startsWith("# ")) {
        this.renderHeading(line, 1)
        i++
        continue
      }
      if (line.startsWith("## ")) {
        this.renderHeading(line, 2)
        i++
        continue
      }
      if (line.startsWith("### ")) {
        this.renderHeading(line, 3)
        i++
        continue
      }

      if (line.startsWith(">")) {
        this.renderBlockquote(line)
        i++
        continue
      }

      if (/^-{3,}$/.test(line.trim())) {
        this.renderHorizontalRule()
        i++
        continue
      }

      if (/^!\[(.+?)\]\((.+?)\)$/.test(line.trim())) {
        const match = line.trim().match(/^!\[(.+?)\]\((.+?)\)$/)
        if (match) this.renderImage(match[1], match[2])
        i++
        continue
      }

      if (line.startsWith("- ") || line.startsWith("* ")) {
        const items: string[] = []
        while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
          items.push(lines[i].replace(/^[-*]\s+/, ""))
          i++
        }
        this.renderList(items, false)
        continue
      }

      if (/^\d+[.)]\s/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+[.)]\s+/, ""))
          i++
        }
        this.renderList(items, true)
        continue
      }

      if (line.trim() === "") {
        i++
        continue
      }

      this.renderParagraph(line)
      i++
    }
  }

  renderCover(modulosCount: number, licoesCount: number) {
    this.doc.setFont("helvetica", "normal")

    this.doc.setFillColor(99, 102, 241)
    this.doc.rect(0, 0, this.pw, 90, "F")

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(28)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Treinamento CRM", this.pw / 2, 50, { align: "center" })

    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("PDM Têxtil", this.pw / 2, 68, { align: "center" })

    this.doc.setFontSize(10)
    this.doc.text("Sistema de Gestao de Desenvolvimento", this.pw / 2, 80, { align: "center" })

    this.doc.setFillColor(240, 242, 245)
    this.doc.rect(0, 90, this.pw, this.ph - 90, "F")

    this.doc.setTextColor(80, 80, 90)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "normal")

    const lines = [
      "Documento completo de treinamento do modulo CRM.",
      `Total: ${modulosCount} modulos, ${licoesCount} licoes.`,
      "",
      "Conteudo didatico desenvolvido para capacitacao",
      "da equipe comercial da Pro Moda Textil.",
    ]

    let ty = 120
    for (const l of lines) {
      this.doc.text(l, this.pw / 2, ty, { align: "center" })
      ty += 7
    }

    ty += 10
    this.doc.setFontSize(9)
    this.doc.setTextColor(120, 120, 130)
    this.doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, this.pw / 2, ty, { align: "center" })

    ty += 20
    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "italic")
    this.doc.text("CRM não é sobre tecnologia, é sobre pessoas.", this.pw / 2, ty, { align: "center" })
    this.doc.text("Pessoas atendendo melhor outras pessoas.", this.pw / 2, ty + 6, { align: "center" })
    this.doc.text("— ", this.pw / 2, ty + 12, { align: "center" })

    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "normal")

    this.y = this.ph + 1
  }

  renderToc(items: TocItem[]) {
    this.doc.addPage()
    this.pageNum = 2
    this.y = MARGIN_TOP

    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(30, 30, 30)
    this.doc.text("Indice", MARGIN_LEFT, this.y)
    this.y += 10

    this.doc.setDrawColor(99, 102, 241)
    this.doc.setLineWidth(0.5)
    this.doc.line(MARGIN_LEFT, this.y - 4, this.pw - MARGIN_RIGHT, this.y - 4)

    for (const item of items) {
      this.checkPageBreak(6)
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(60, 60, 70)

      const label = sanitizeText(item.titulo)
      const pageLabel = `p. ${item.pageNum}`
      const dots = ".".repeat(Math.max(1, Math.floor((this.cw - this.doc.getStringUnitWidth(label) * 11 * 0.3528 - this.doc.getStringUnitWidth(pageLabel) * 11 * 0.3528 - 4) / 0.5)))

      this.doc.text(label, MARGIN_LEFT, this.y)
      this.doc.setFont("helvetica", "normal")
      this.doc.setTextColor(160, 160, 170)
      this.doc.text(dots, MARGIN_LEFT + this.doc.getStringUnitWidth(label) * 11 * 0.3528 + 1, this.y)
      this.doc.text(pageLabel, this.pw - MARGIN_RIGHT, this.y, { align: "right" })
      this.y += 6
    }

    this.doc.setTextColor(0, 0, 0)
    this.y += 6
  }

  private addPageAndTrack() {
    this.addFooter()
    this.doc.addPage()
    this.pageNum++
    this.y = MARGIN_TOP
    this.addHeader()
  }

  renderModulo(modulo: ModuloData, moduloIndex: number) {
    this.addPageAndTrack()

    const moduloTitle = sanitizeText(modulo.titulo)
    this.headerLeft = `Modulo ${moduloIndex + 1}: ${moduloTitle}`
    this.headerRight = `Modulo ${moduloIndex + 1}`

    this.doc.setFillColor(99, 102, 241)
    this.doc.rect(0, this.y - 6, this.pw, 14, "F")
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`Modulo ${moduloIndex + 1}: ${moduloTitle}`, MARGIN_LEFT, this.y + 4)
    this.doc.setTextColor(0, 0, 0)
    this.y += 16

    if (modulo.descricao) {
      this.doc.setFontSize(FONT_SIZE_BODY)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(80, 80, 90)
      const lines = this.doc.splitTextToSize(sanitizeText(modulo.descricao), this.cw)
      this.doc.text(lines, MARGIN_LEFT, this.y)
      this.y += lines.length * LINE_HEIGHT + 4
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFont("helvetica", "normal")
    }

    const licoesAtivas = modulo.licoes.filter((l) => l.ativo)
    for (let idx = 0; idx < licoesAtivas.length; idx++) {
      const licao = licoesAtivas[idx]

      const licaoTitle = sanitizeText(licao.titulo)
      this.headerRight = `${moduloIndex + 1}.${idx + 1} ${licaoTitle}`

      this.checkPageBreak(10)
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "bold")
      this.doc.setTextColor(50, 50, 60)
      this.doc.text(`${idx + 1}. ${licaoTitle}`, MARGIN_LEFT, this.y)
      this.y += 7

      if (licao.preRequisitos) {
        this.renderPrerequisito(licao.preRequisitos)
      }

      this.renderMarkdown(licao.conteudoMd)
    }
  }

  renderLicaoIndividual(licao: LicaoData, moduloTitulo: string, moduloIndex: number, licaoIndex: number) {
    this.y = MARGIN_TOP
    this.pageNum = 1

    const cleanModTitulo = sanitizeText(moduloTitulo)
    const cleanLicaoTitulo = sanitizeText(licao.titulo)
    this.headerLeft = `Treinamento CRM — ${cleanModTitulo}`
    this.headerRight = `${moduloIndex + 1}.${licaoIndex + 1} ${cleanLicaoTitulo}`

    this.addHeader()

    this.doc.setFillColor(99, 102, 241)
    this.doc.rect(0, this.y - 4, this.pw, 12, "F")
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(11)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(`${cleanModTitulo} — ${cleanLicaoTitulo}`, MARGIN_LEFT, this.y + 3)
    this.doc.setTextColor(0, 0, 0)
    this.y += 14

    if (licao.preRequisitos) {
      this.renderPrerequisito(licao.preRequisitos)
    }

    this.renderMarkdown(licao.conteudoMd)

    this.addFooter()
  }

  save(filename: string) {
    this.doc.save(filename)
  }

  getPageNum() { return this.pageNum }
}

export async function exportTreinamentoCompletoPdf(modulos: ModuloData[]) {
  const modulosAtivos = modulos.filter((m) => m.ativo)
  const totalLicoes = modulosAtivos.reduce((acc, m) => acc + m.licoes.filter((l) => l.ativo).length, 0)

  const renderer = new TreinamentoPdfRenderer()

  renderer.renderCover(modulosAtivos.length, totalLicoes)

  const tocItems: TocItem[] = []
  for (let i = 0; i < modulosAtivos.length; i++) {
    const m = modulosAtivos[i]
    const licoesAtivas = m.licoes.filter((l) => l.ativo)
    tocItems.push({
      titulo: `Módulo ${i + 1}: ${m.titulo}`,
      pageNum: i + 3,
      subItems: licoesAtivas.map((l, idx) => ({
        titulo: `${idx + 1}. ${l.titulo}`,
        pageNum: 0,
      })),
    })
  }

  renderer.renderToc(tocItems)

  for (let i = 0; i < modulosAtivos.length; i++) {
    renderer.renderModulo(modulosAtivos[i], i)
  }

  renderer.save("Treinamento_CRM_Completo.pdf")
}

export async function exportLicaoPdf(licao: LicaoData, moduloTitulo: string, moduloIndex: number, licaoIndex: number) {
  const renderer = new TreinamentoPdfRenderer()
  const cleanMod = removerAcentos(sanitizeText(moduloTitulo))
  const cleanLic = removerAcentos(sanitizeText(licao.titulo))
  const filename = `CRM-${cleanMod}-${cleanLic}.pdf`.replace(/[^a-zA-Z0-9-_.]/g, "_")

  renderer.renderLicaoIndividual(licao, moduloTitulo, moduloIndex, licaoIndex)

  renderer.save(filename)
}
