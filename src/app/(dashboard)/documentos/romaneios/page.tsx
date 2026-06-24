"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Loader2,
  Truck,
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  RefreshCw,
  Globe,
  FileText,
  Package,
  User,
  MapPin,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

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
  data_entrada: string
  op: number
  nome_operador: string
  largura: number
  gramatura: number
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
  vendido: number
  saldo: number
  unitario: number
  valor_vendido: number
}

interface GrupoRomaneio {
  romaneio: number
  capa: Rolo
  rolos: Rolo[]
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

function formatarPeso(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(4)} kg`
}

function formatarMetragem(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(1)} m`
}

export default function RomaneiosPage() {
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

  useEffect(() => {
    setLoadingInt(true)
    fetch("/api/integracao/listar?tela=romaneios")
      .then((res) => res.json())
      .then((data) => {
        setIntegracoes(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => toast.error("Erro ao carregar integrações"))
      .finally(() => setLoadingInt(false))
  }, [])

  const itensFiltrados = useMemo(() => {
    if (!searchTerm) return itens
    const termo = searchTerm.toLowerCase()
    return itens.filter(
      (item) =>
        String(item.pedido).includes(termo) ||
        String(item.romaneio).includes(termo),
    )
  }, [itens, searchTerm])

  const grupos = useMemo(() => {
    const map = new Map<number, GrupoRomaneio>()
    for (const item of itensFiltrados) {
      let grupo = map.get(item.romaneio)
      if (!grupo) {
        grupo = {
          romaneio: item.romaneio,
          capa: item,
          rolos: [],
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
    return Array.from(map.values()).sort((a, b) => b.romaneio - a.romaneio)
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

  function handleCarregarTodos() {
    setSearchInput("")
    setSearchTerm("")
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

  const ORIENTACAO_LABEL: Record<OrientacaoPdf, string> = {
    portrait: "Retrato",
    landscape: "Paisagem",
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
      doc.setFillColor(180, 182, 188)
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
    doc.setFillColor(180, 182, 188)
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
    const produtosOrdenados = Array.from(produtosMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    const head = [
      ["#", "Cód. Rolo", "Produto", "Narrativa", "Lote", "Metragem", "P. Bruto", "P. Líquido", "Largura", "Endereço"],
    ]
    const body: any[] = []

    for (const [prodNome, lotesMap] of produtosOrdenados) {
      const lotesOrdenados = Array.from(lotesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

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
      headStyles: { fillColor: [180, 182, 188], textColor: [51, 51, 51], fontStyle: "bold" },
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
        doc.setTextColor(130, 130, 130)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Romaneios de Expedição{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta, conferência e impressão de romaneios de carga
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
              <div className="space-y-6">
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
                              <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase">Largura</th>
                              <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-500 uppercase">Endereço</th>
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
                                let prodRolos = 0
                                let prodMetragem = 0
                                let prodPesoBruto = 0
                                let prodPesoLiquido = 0
                                trs.push(
                                  <tr key={`prod-${prodNome}`} className="bg-purple-50 dark:bg-purple-950/20">
                                    <td colSpan={10} className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400">
                                      PRODUTO: {prodNome}
                                    </td>
                                  </tr>
                                )
                                for (const [loteNome, rolos] of lotsSorted) {
                                  let subMetragem = 0
                                  let subPesoBruto = 0
                                  let subPesoLiquido = 0
                                  for (const r of rolos) {
                                    subMetragem += r.quantidade || 0
                                    subPesoBruto += r.peso_bruto || 0
                                    subPesoLiquido += r.peso_liquido || 0
                                  }
                                  prodRolos += rolos.length
                                  prodMetragem += subMetragem
                                  prodPesoBruto += subPesoBruto
                                  prodPesoLiquido += subPesoLiquido
                                  trs.push(
                                    <tr key={`lote-${prodNome}-${loteNome}`} className="bg-blue-50 dark:bg-blue-950/30">
                                      <td colSpan={10} className="px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
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
                                        <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(rolo.peso_bruto)}</td>
                                        <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(rolo.peso_liquido)}</td>
                                        <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center">{rolo.largura ? `${rolo.largura.toFixed(1)}m` : "—"}</td>
                                        <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center font-mono">{rolo.endereco_rolo || "—"}</td>
                                      </tr>
                                    )
                                  })
                                  trs.push(
                                    <tr key={`sub-lote-${prodNome}-${loteNome}`} className="bg-slate-50 dark:bg-slate-800/50">
                                      <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 text-right">{rolos.length} rolo(s)</td>
                                      <td></td>
                                      <td className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right font-mono">{formatarMetragem(subMetragem)}</td>
                                      <td className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(subPesoBruto)}</td>
                                      <td className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right font-mono">{formatarPeso(subPesoLiquido)}</td>
                                      <td colSpan={2}></td>
                                    </tr>
                                  )
                                }
                                trs.push(
                                  <tr key={`sub-prod-${prodNome}`} className="bg-purple-50 dark:bg-purple-950/20">
                                    <td colSpan={5} className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400">SUBTOTAL {prodNome}: {prodRolos} rolo(s)</td>
                                    <td className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400 text-right font-mono">{formatarMetragem(prodMetragem)}</td>
                                    <td className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400 text-right font-mono">{formatarPeso(prodPesoBruto)}</td>
                                    <td className="px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-400 text-right font-mono">{formatarPeso(prodPesoLiquido)}</td>
                                    <td colSpan={2}></td>
                                  </tr>
                                )
                              }
                              return trs
                            })()}
                          </tbody>
                          <tfoot className="bg-blue-50 dark:bg-blue-950/30 border-t-2 border-slate-200 dark:border-slate-700">
                            <tr>
                              <td className="px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                                {grupo.totalRolos}
                              </td>
                              <td colSpan={3} className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                                Total Geral
                              </td>
                              <td></td>
                              <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                                {formatarMetragem(grupo.totalMetragem)}
                              </td>
                              <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                                {formatarPeso(grupo.totalPesoBruto)}
                              </td>
                              <td className="px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 text-right font-mono">
                                {formatarPeso(grupo.totalPesoLiquido)}
                              </td>
                              <td colSpan={2}></td>
                            </tr>
                          </tfoot>
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
                Digite um número de pedido ou romaneio e clique em &quot;Buscar&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ou clique em &quot;Carregar Todos&quot; para listar todos os romaneios
              </p>
            </div>
          ) : itens.length > 0 && grupos.length === 0 && !loadingData ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Search size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Nenhum resultado para &quot;{searchTerm}&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tente outro número de pedido ou romaneio
              </p>
            </div>
          ) : null}
        </div>
      )}
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
