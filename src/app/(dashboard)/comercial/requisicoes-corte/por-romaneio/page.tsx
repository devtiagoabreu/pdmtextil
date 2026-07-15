"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2, Truck, Search, RefreshCw, Globe, Scissors,
  ChevronDown, ChevronUp, User, MapPin, Hash,
  FileText, ArrowLeft, Package, Printer
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"

interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: string
  telas?: string[]
}

interface Rolo {
  romaneio: number
  codigo_rolo: number
  produto: string
  narrativa: string
  lote: number
  lote_produto: string
  quantidade: number
  peso_bruto: number
  peso_liquido: number
  largura: number
  endereco_rolo: string | null
  pedido: number
  situacao: string
  emissao: string
  entrega: string
  chegada: string | null
  cnpj: string
  nome_cliente: string
  fantasia: string
  cidade: string
  uf: string
  nome_represenante: string
  nome_regiao: string
  linha: string
  grupo: string
  sub: string
  cor: string
}

interface ProdutoAgrupado {
  nome: string
  narrativa: string
  cor: string
  totalMetragem: number
  rolos: Rolo[]
}

interface GrupoRomaneio {
  romaneio: number
  capa: Rolo
  rolos: Rolo[]
  produtos: ProdutoAgrupado[]
  totalRolos: number
  totalMetragem: number
  totalPesoBruto: number
  totalPesoLiquido: number
}

type OrientacaoPdf = "portrait" | "landscape"

function formatarData(data: string | null | undefined): string {
  if (!data) return "—"
  try {
    return new Date(data).toLocaleDateString("pt-BR")
  } catch {
    return data
  }
}

function formatarMetragem(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(1)} m`
}

function formatarPeso(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(4)} kg`
}

const ORIENTACAO_LABEL: Record<OrientacaoPdf, string> = {
  portrait: "Retrato",
  landscape: "Paisagem",
}

interface ItemCorteDialog {
  produto: string
  narrativa: string
  cor: string
  metragemDisponivel: number
  metragem: string
}

export default function RequisicaoPorRomaneioPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [loadingInt, setLoadingInt] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [itens, setItens] = useState<Rolo[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [expandedRomaneio, setExpandedRomaneio] = useState<number | null>(null)
  const [selectedRomaneios, setSelectedRomaneios] = useState<Set<number>>(new Set())
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [orientacaoPdf, setOrientacaoPdf] = useState<OrientacaoPdf>("portrait")
  const [criando, setCriando] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogRomaneio, setDialogRomaneio] = useState<GrupoRomaneio | null>(null)
  const [dialogItens, setDialogItens] = useState<ItemCorteDialog[]>([])

  useEffect(() => {
    setLoadingInt(true)
    const tela = pathname.replace(/^\//, "").split("/").pop() || ""
    fetch(`/api/integracao/listar?tela=${encodeURIComponent(tela)}`)
      .then((res) => res.json())
      .then((data) => {
        setIntegracoes(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => toast.error("Erro ao carregar integrações"))
      .finally(() => setLoadingInt(false))
  }, [pathname])

  const itensFiltrados = useMemo(() => {
    if (!searchTerm) return itens
    const termo = searchTerm.toLowerCase()
    return itens.filter(
      (item) =>
        String(item.pedido).includes(termo) ||
        String(item.romaneio).includes(termo),
    )
  }, [itens, searchTerm])

  function agruparProdutos(rolos: Rolo[]): ProdutoAgrupado[] {
    const map = new Map<string, Rolo[]>()
    for (const r of rolos) {
      const key = r.produto || "SEM PRODUTO"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    const produtos: ProdutoAgrupado[] = []
    for (const [nome, rolos] of map) {
      const total = rolos.reduce((acc, r) => acc + (r.quantidade || 0), 0)
      produtos.push({
        nome,
        narrativa: rolos[0]?.narrativa || "",
        cor: rolos[0]?.cor || "",
        totalMetragem: total,
        rolos,
      })
    }
    return produtos.sort((a, b) => a.nome.localeCompare(b.nome))
  }

  const grupos = useMemo(() => {
    const map = new Map<number, GrupoRomaneio>()
    for (const item of itensFiltrados) {
      let grupo = map.get(item.romaneio)
      if (!grupo) {
        grupo = {
          romaneio: item.romaneio,
          capa: item,
          rolos: [],
          produtos: [],
          totalRolos: 0,
          totalMetragem: 0,
          totalPesoBruto: 0,
          totalPesoLiquido: 0,
        }
        map.set(item.romaneio, grupo)
      }
      grupo.rolos.push(item)
      grupo.totalRolos++
      grupo.totalMetragem += item.quantidade || 0
      grupo.totalPesoBruto += item.peso_bruto || 0
      grupo.totalPesoLiquido += item.peso_liquido || 0
    }
    const result = Array.from(map.values()).sort((a, b) => b.romaneio - a.romaneio)
    for (const g of result) {
      g.produtos = agruparProdutos(g.rolos)
    }
    return result
  }, [itensFiltrados])

  const buscar = useCallback(async (search?: string) => {
    if (!selectedId) return
    setLoadingData(true)
    setItens([])
    setExpandedRomaneio(null)
    setSelectedRomaneios(new Set())
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const qs = params.toString()
      const res = await fetch(`/api/integracao/${selectedId}/executar${qs ? `?${qs}` : ""}`)
      const data = await res.json()
      if (!data.success) {
        toast.error(`API retornou erro: ${data.status}`)
        return
      }
      const body = data.responseBody
      const rawItems = body?.items || (Array.isArray(body) ? body : body?.data || [])
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        toast.error("Nenhum romaneio encontrado")
        return
      }
      setItens(rawItems as Rolo[])
      const romaneios = [...new Set(rawItems.map((r: Rolo) => r.romaneio))]
      if (romaneios.length > 0) setExpandedRomaneio(romaneios[0])
      toast.success(`${rawItems.length} rolo(s) de ${romaneios.length} romaneio(s) carregado(s)`)
    } catch {
      toast.error("Erro ao buscar dados")
    } finally {
      setLoadingData(false)
    }
  }, [selectedId])

  function handleCarregarTodos() {
    setSearchInput("")
    setSearchTerm("")
    setSelectedRomaneios(new Set())
    buscar()
  }

  function toggleRomaneio(numero: number) {
    setSelectedRomaneios((prev) => {
      const next = new Set(prev)
      if (next.has(numero)) next.delete(numero)
      else next.add(numero)
      return next
    })
  }

  function handleSearch() {
    const termo = searchInput.trim()
    setSearchTerm(termo)
    setExpandedRomaneio(null)
    setSelectedRomaneios(new Set())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  function handleLimparBusca() {
    setSearchInput("")
    setSearchTerm("")
    setExpandedRomaneio(null)
    setSelectedRomaneios(new Set())
  }

  function abrirDialog(grupo: GrupoRomaneio) {
    setDialogRomaneio(grupo)
    setDialogItens(
      grupo.produtos.map((p) => ({
        produto: p.nome,
        narrativa: p.narrativa,
        cor: p.cor,
        metragemDisponivel: p.totalMetragem,
        metragem: p.totalMetragem > 0 ? String(p.totalMetragem) : "",
      })),
    )
    setDialogOpen(true)
  }

  function atualizarMetragem(index: number, valor: string) {
    setDialogItens((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], metragem: valor }
      return next
    })
  }

  async function confirmarCriacao() {
    if (!dialogRomaneio) return

    const itensValidos = dialogItens.filter((item) => {
      const num = parseFloat(item.metragem.replace(",", "."))
      return !isNaN(num) && num > 0
    })

    if (itensValidos.length === 0) {
      toast.error("Informe a metragem para pelo menos um produto")
      return
    }

    setCriando(true)
    try {
      const itensPayload = itensValidos.map((item) => {
        const partes = item.produto.split(".")
        const bbbbb = partes[1] || ""
        const dddddd = partes[3] || ""
        return {
          codigoProduto: item.produto,
          ordem: bbbbb,
          artigo: item.narrativa || "",
          cor: dddddd.slice(-2),
          desenho: dddddd.slice(0, 4),
          quantidade: item.metragem,
        }
      })

      const res = await fetch("/api/comercial/requisicoes-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itensPayload,
          observacoes: `Criado a partir do Romaneio Nº ${dialogRomaneio.romaneio}`,
          entreguePor: "",
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao criar requisição")
      }

      const criada = await res.json()
      toast.success(`Requisição de corte #${criada.id} criada com sucesso!`)
      setDialogOpen(false)
      router.push(`/comercial/requisicoes-corte/${criada.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar requisição")
    } finally {
      setCriando(false)
    }
  }

  async function renderRomaneioPage(
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
    const capaH = isLandscape ? 30 : 38
    const col1 = margin + 4
    const col2 = isLandscape ? 90 : 82
    const col3 = isLandscape ? 160 : 125
    const col4 = isLandscape ? 215 : 170

    doc.setDrawColor(200)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(margin, y, pageWidth - margin * 2, capaH, 2, 2, "FD")

    doc.setFontSize(fsTit).setFont("helvetica", "bold")
    doc.text("CLIENTE", col1, y + 4)
    doc.setFont("helvetica", "normal").setFontSize(fsVal)
    doc.text(`${c.nome_cliente}`, col1, y + 10)
    doc.text(`CNPJ: ${c.cnpj}`, col1, y + 16)
    doc.text(`${c.cidade} / ${c.uf}`, col1, y + 22)

    doc.setFont("helvetica", "bold").setFontSize(fsTit)
    doc.text("REPRESENTANTE", col2, y + 4)
    doc.setFont("helvetica", "normal").setFontSize(fsVal)
    doc.text(`${c.nome_represenante}`, col2, y + 10)
    doc.text(`Região: ${c.nome_regiao}`, col2, y + 16)

    doc.setFont("helvetica", "bold").setFontSize(fsTit)
    doc.text("TOTAIS", col4, y + 4)
    doc.setFont("helvetica", "bold").setFontSize(fsVal)
    doc.text(`${grupo.totalRolos} rolo(s)`, col4, y + 10)
    doc.text(`Metragem: ${formatarMetragem(grupo.totalMetragem)}`, col4, y + 16)
    doc.text(`P. Bruto: ${formatarPeso(grupo.totalPesoBruto)}`, col4, y + 22)
    doc.text(`P. Líquido: ${formatarPeso(grupo.totalPesoLiquido)}`, col4, y + 28)

    const pedidoY = y + capaH + (isLandscape ? 3 : 5)
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

    y += capaH + (isLandscape ? 14 : 22)

    const head = [
      ["#", "Cód. Rolo", "Produto", "Narrativa", "Lote", "Metragem", "P. Bruto", "P. Líquido"],
    ]
    const body: any[] = []

    for (const prod of grupo.produtos) {
      let prodRolos = 0
      let prodMetragem = 0
      let prodPesoBruto = 0
      let prodPesoLiquido = 0

      body.push([
        {
          content: `PRODUTO: ${prod.nome}`,
          colSpan: 8,
          styles: { fillColor: [233, 213, 255], fontStyle: "bold", fontSize: isLandscape ? 6.5 : 6, halign: "left" },
        },
      ])

      const lotesMap = new Map<string, Rolo[]>()
      for (const r of prod.rolos) {
        const loteNome = r.lote_produto || "SEM LOTE"
        if (!lotesMap.has(loteNome)) lotesMap.set(loteNome, [])
        lotesMap.get(loteNome)!.push(r)
      }
      const lotesOrdenados = Array.from(lotesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

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
            colSpan: 8,
            styles: { fillColor: [219, 234, 254], fontStyle: "bold", fontSize: isLandscape ? 6.5 : 6, halign: "left" },
          },
        ])

        rolos.forEach((r, idx) => {
          body.push([
            String(idx + 1),
            String(r.codigo_rolo),
            r.produto || "—",
            r.narrativa || "—",
            r.lote_produto || "—",
            formatarMetragem(r.quantidade),
            formatarPeso(r.peso_bruto),
            formatarPeso(r.peso_liquido),
          ])
        })

        body.push([
          { content: "", colSpan: 3, styles: { fillColor: [245, 247, 250] } },
          { content: `${subRolos} rolo(s)`, styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "left" } },
          { content: "", styles: { fillColor: [245, 247, 250] } },
          { content: formatarMetragem(subMetragem), styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "right" } },
          { content: formatarPeso(subPesoBruto), styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "right" } },
          { content: formatarPeso(subPesoLiquido), styles: { fillColor: [245, 247, 250], fontStyle: "bold", fontSize: isLandscape ? 7 : 6.5, halign: "right" } },
        ])
      }

      body.push([
        { content: `SUBTOTAL ${prod.nome}: ${prodRolos} rolo(s)`, colSpan: 4, styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255] } },
        { content: formatarMetragem(prodMetragem), styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255], halign: "right" } },
        { content: formatarPeso(prodPesoBruto), styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255], halign: "right" } },
        { content: formatarPeso(prodPesoLiquido), styles: { fontStyle: "bold", fontSize: isLandscape ? 7.5 : 7, fillColor: [233, 213, 255], halign: "right" } },
        { content: "", colSpan: 2, styles: { fillColor: [233, 213, 255] } },
      ])
    }

    body.push([
      { content: `TOTAL GERAL: ${grupo.totalRolos} rolo(s)`, colSpan: 4, styles: { fontStyle: "bold", fontSize: isLandscape ? 9 : 8, fillColor: [191, 219, 254] } },
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

  async function gerarPdf(numero: number, orientacao?: OrientacaoPdf) {
    const grupo = grupos.find((g) => g.romaneio === numero)
    if (!grupo) return

    setGerandoPdf(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      const orient = orientacao || orientacaoPdf
      const doc = new jsPDF(orient)
      const isLandscape = orient === "landscape"
      const pageWidth = doc.internal.pageSize.getWidth()

      let empresa: Record<string, any> | null = null
      let logoImg: HTMLImageElement | null = null
      try {
        const res = await fetch("/api/admin/config/empresa")
        const list = await res.json()
        empresa = list.find((e: any) => e.isDefault) || list[0]
        if (empresa?.logoUrl) {
          logoImg = await loadImage(empresa.logoUrl)
        }
      } catch {}

      await renderRomaneioPage(doc, grupo, numero, isLandscape, pageWidth, empresa, logoImg)

      doc.save(`romaneio-${numero}.pdf`)
      toast.success(`PDF do romaneio ${numero} gerado!`)
    } catch (err) {
      toast.error("Erro ao gerar PDF: " + (err instanceof Error ? err.message : "desconhecido"))
    } finally {
      setGerandoPdf(false)
    }
  }

  async function gerarPdfConsolidado() {
    if (selectedRomaneios.size === 0) {
      toast.error("Selecione ao menos um romaneio")
      return
    }

    setGerandoPdf(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      const orient = orientacaoPdf
      const doc = new jsPDF(orient)
      const isLandscape = orient === "landscape"
      const pageWidth = doc.internal.pageSize.getWidth()

      let empresa: Record<string, any> | null = null
      let logoImg: HTMLImageElement | null = null
      try {
        const res = await fetch("/api/admin/config/empresa")
        const list = await res.json()
        empresa = list.find((e: any) => e.isDefault) || list[0]
        if (empresa?.logoUrl) {
          logoImg = await loadImage(empresa.logoUrl)
        }
      } catch {}

      const nums = Array.from(selectedRomaneios).sort((a, b) => a - b)
      for (let i = 0; i < nums.length; i++) {
        const grupo = grupos.find((g) => g.romaneio === nums[i])
        if (!grupo) continue
        if (i > 0) doc.addPage()
        await renderRomaneioPage(doc, grupo, nums[i], isLandscape, pageWidth, empresa, logoImg)
      }

      const sufixo = nums.length <= 3 ? nums.join("-") : `${nums[0]}-${nums[nums.length - 1]}`
      doc.save(`romaneios-${sufixo}.pdf`)
      toast.success(`PDF consolidado com ${nums.length} romaneio(s) gerado!`)
    } catch (err) {
      toast.error("Erro ao gerar PDF consolidado: " + (err instanceof Error ? err.message : "desconhecido"))
    } finally {
      setGerandoPdf(false)
    }
  }

  async function gerarPdfsSelecionados() {
    if (selectedRomaneios.size === 0) {
      toast.error("Selecione ao menos um romaneio")
      return
    }
    setGerandoPdf(true)
    for (const num of selectedRomaneios) {
      await gerarPdf(num)
    }
    setGerandoPdf(false)
    toast.success(`${selectedRomaneios.size} PDF(s) gerados!`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/requisicoes-corte"
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Requisição de Corte por Romaneio{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Selecione um romaneio e crie uma requisição de corte com a metragem desejada
          </p>
        </div>
      </div>

      {loadingInt ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : integracoes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Globe size={44} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Nenhuma integração configurada para romaneios
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre uma integração em Configurações &gt; Integrações com a tela &quot;romaneios&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Integração</label>
                <div className="flex gap-2 flex-wrap">
                  {integracoes.map((int) => (
                    <button
                      key={int.id}
                      type="button"
                      onClick={() => setSelectedId(int.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedId === int.id
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {int.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Nº Pedido / Romaneio
                  </label>
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: 7603 ou 22742"
                    className="w-48"
                  />
                </div>
                <Button onClick={handleSearch} disabled={!selectedId || loadingData || itens.length === 0} className="gap-2">
                  <Search size={16} />
                  Buscar
                </Button>
                {searchTerm && (
                  <Button variant="outline" onClick={handleLimparBusca} className="gap-2">
                    Limpar Filtro
                  </Button>
                )}
                <Button variant="outline" onClick={handleCarregarTodos} disabled={!selectedId || loadingData} className="gap-2">
                  {loadingData ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Carregar Todos
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>PDF:</span>
                <button
                  type="button"
                  onClick={() => setOrientacaoPdf(orientacaoPdf === "portrait" ? "landscape" : "portrait")}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    orientacaoPdf === "portrait"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {ORIENTACAO_LABEL[orientacaoPdf]}
                </button>
              </div>
              {grupos.length > 0 && (
                <>
                  <Button
                    onClick={gerarPdfsSelecionados}
                    disabled={selectedRomaneios.size === 0 || gerandoPdf}
                    className="gap-2"
                  >
                    {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    PDF ({selectedRomaneios.size})
                  </Button>
                  <Button
                    onClick={gerarPdfConsolidado}
                    disabled={selectedRomaneios.size === 0 || gerandoPdf}
                    className="gap-2 bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    Consolidado ({selectedRomaneios.size})
                  </Button>
                </>
              )}
            </div>
          </div>

          {loadingData ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : grupos.length > 0 ? (
            <div className="space-y-3">
              {searchTerm && (
                <p className="text-xs text-slate-500">
                  Filtrando por &quot;{searchTerm}&quot; — {itensFiltrados.length} de {itens.length} rolo(s)
                </p>
              )}
              <div className="space-y-4">
                {grupos.map((grupo) => (
                  <div
                    key={grupo.romaneio}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedRomaneios.has(grupo.romaneio)}
                          onChange={() => toggleRomaneio(grupo.romaneio)}
                          className="mt-1 rounded"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              Romaneio Nº {grupo.romaneio}
                            </h2>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium">
                              {grupo.totalRolos} rolo(s)
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Pedido {grupo.capa.pedido}
                            </span>
                          </div>
                        </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => gerarPdf(grupo.romaneio)}
                            disabled={gerandoPdf}
                            className="gap-1 text-xs"
                          >
                            <FileText size={14} />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => abrirDialog(grupo)}
                            className="gap-1.5 text-xs"
                          >
                            <Scissors size={14} />
                            Requisição de Corte
                          </Button>
                          <button
                            onClick={() =>
                              setExpandedRomaneio(
                                expandedRomaneio === grupo.romaneio ? null : grupo.romaneio,
                              )
                            }
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {expandedRomaneio === grupo.romaneio ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <User size={14} className="shrink-0" />
                          <span className="truncate">{grupo.capa.nome_cliente}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin size={14} className="shrink-0" />
                          <span className="truncate">
                            {grupo.capa.cidade}/{grupo.capa.uf}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Hash size={14} className="shrink-0" />
                          <span>CNPJ: {grupo.capa.cnpj}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Package size={14} className="shrink-0" />
                          <span className="truncate">Rep: {grupo.capa.nome_represenante}</span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {grupo.produtos.map((prod) => (
                          <div
                            key={prod.nome}
                            className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3"
                          >
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate" title={prod.nome}>
                              {prod.nome}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatarMetragem(prod.totalMetragem)} disponível
                            </p>
                            {prod.cor && (
                              <p className="text-[11px] text-slate-400 truncate" title={prod.cor}>
                                Cor: {prod.cor}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {expandedRomaneio === grupo.romaneio && (
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                              <tr>
                                <th className="px-3 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase w-10">#</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Cód. Rolo</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Produto</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Narrativa</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase">Lote</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">Metragem</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">P. Bruto</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase">P. Líquido</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {(() => {
                                const prodsMap = new Map<string, Map<string, Rolo[]>>()
                                for (const r of grupo.rolos) {
                                  const p = r.produto || "SEM PRODUTO"
                                  const l = r.lote_produto || "SEM LOTE"
                                  if (!prodsMap.has(p)) prodsMap.set(p, new Map())
                                  const lm = prodsMap.get(p)!
                                  if (!lm.has(l)) lm.set(l, [])
                                  lm.get(l)!.push(r)
                                }
                                const prodsSorted = Array.from(prodsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
                                const trs: React.ReactNode[] = []
                                for (const [prodNome, lotesMap] of prodsSorted) {
                                  const lotsSorted = Array.from(lotesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
                                  trs.push(
                                    <tr key={`prod-${prodNome}`} className="bg-purple-50 dark:bg-purple-950/20">
                                      <td colSpan={7} className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400">
                                        PRODUTO: {prodNome}
                                      </td>
                                    </tr>
                                  )
                                  for (const [loteNome, rolos] of lotsSorted) {
                                    trs.push(
                                      <tr key={`lote-${prodNome}-${loteNome}`} className="bg-blue-50 dark:bg-blue-950/30">
                                        <td colSpan={7} className="px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                          LOTE {loteNome}
                                        </td>
                                      </tr>
                                    )
                                    rolos.forEach((rolo, idx) => {
                                      trs.push(
                                        <tr key={rolo.codigo_rolo} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-3 py-2 text-sm text-slate-500 text-center font-mono text-[12px]">{idx + 1}</td>
                                          <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{rolo.codigo_rolo}</td>
                                          <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono text-[12px]">{rolo.produto}</td>
                                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={rolo.narrativa}>{rolo.narrativa}</td>
                                          <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono">{rolo.lote_produto}</td>
                                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{formatarMetragem(rolo.quantidade)}</td>
                                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{`${Number(rolo.peso_bruto || 0).toFixed(4)} kg`}</td>
                                        </tr>
                                      )
                                    })
                                  }
                                }
                                return trs
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : itens.length === 0 && !loadingData ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Truck size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Carregue os romaneios para criar requisições de corte
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Clique em &quot;Carregar Todos&quot; para listar os romaneios disponíveis
              </p>
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Requisição de Corte</DialogTitle>
            <DialogDescription>
              Romaneio Nº {dialogRomaneio?.romaneio} — Informe a metragem desejada para cada produto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {dialogItens.map((item, index) => (
              <div
                key={item.produto}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                      {item.produto}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Disponível: {formatarMetragem(item.metragemDisponivel)}
                      {item.cor && ` — Cor: ${item.cor}`}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Metragem para corte</Label>
                  <Input
                    value={item.metragem}
                    onChange={(e) => atualizarMetragem(index, e.target.value)}
                    placeholder="Ex: 50"
                    className="h-9 text-sm mt-0.5"
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCriacao} disabled={criando} className="gap-2">
              {criando && <Loader2 size={16} className="animate-spin" />}
              <Scissors size={16} />
              Criar Requisição de Corte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
