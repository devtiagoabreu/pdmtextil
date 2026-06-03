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
  const [itens, setItens] = useState<Rolo[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [expandedRomaneio, setExpandedRomaneio] = useState<number | null>(null)
  const [selectedRomaneios, setSelectedRomaneios] = useState<Set<number>>(new Set())
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [orientacaoPdf, setOrientacaoPdf] = useState<OrientacaoPdf>("portrait")
  const ultimaBuscaRef = useRef("")

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

  const grupos = useMemo(() => {
    const map = new Map<number, GrupoRomaneio>()
    for (const item of itens) {
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
  }, [itens])

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
    ultimaBuscaRef.current = termo
    buscar(termo || undefined)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  function handleCarregarTodos() {
    setSearchInput("")
    ultimaBuscaRef.current = ""
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
      try {
        const res = await fetch("/api/admin/config/empresa")
        const list = await res.json()
        empresa = list.find((e: any) => e.isDefault) || list[0]
      } catch {}

      const margin = 8
      let y = margin

      if (empresa) {
        if (empresa.logoUrl) {
          try {
            const img = await loadImage(empresa.logoUrl)
            if (img) {
              const maxW = isLandscape ? 35 : 30
              const maxH = isLandscape ? 18 : 15
              const scale = Math.min(maxW / img.width, maxH / img.height, 1)
              doc.addImage(img, "PNG", margin, y, img.width * scale, img.height * scale)
            }
          } catch {}
        }
        doc.setFontSize(isLandscape ? 10 : 9).setFont("helvetica", "bold")
        doc.text(empresa.nome || "", isLandscape ? 48 : 42, y + 4)
        doc.setFontSize(isLandscape ? 7 : 6.5).setFont("helvetica", "normal")
        let yOff = y + 9
        if (empresa.documento) { doc.text(`CNPJ: ${empresa.documento}`, isLandscape ? 48 : 42, yOff); yOff += 3.5 }
        if (empresa.endereco) { doc.text(empresa.endereco, isLandscape ? 48 : 42, yOff); yOff += 3.5 }
        if (empresa.cidade || empresa.uf) { doc.text([empresa.cidade, empresa.uf].filter(Boolean).join("/"), isLandscape ? 48 : 42, yOff) }
        y = isLandscape ? 32 : 28
      } else {
        y = isLandscape ? 18 : 16
      }

      doc.setFontSize(isLandscape ? 14 : 12).setFont("helvetica", "bold")
      doc.text(`Romaneio Nº ${numero}`, margin, y)

      const c = grupo.capa
      y += isLandscape ? 6 : 5

      const fsTit = isLandscape ? 7 : 6.5
      const fsVal = isLandscape ? 6.5 : 6
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
      doc.setFont("helvetica", "normal").setFontSize(fsVal)
      doc.text(`${grupo.totalRolos} rolo(s)`, col4, y + linha1)
      doc.text(`Metragem: ${formatarMetragem(grupo.totalMetragem)}`, col4, y + linha2)
      doc.text(`P. Bruto: ${formatarPeso(grupo.totalPesoBruto)}`, col4, y + linha3)
      doc.text(`P. Líquido: ${formatarPeso(grupo.totalPesoLiquido)}`, col4, y + linha4)

      y += capaH + 6
      const head = [
        ["#", "Cód. Rolo", "Produto", "Narrativa", "Lote", "Metragem", "P. Bruto", "P. Líquido", "Largura", "Endereço"],
      ]
      const body = grupo.rolos.map((r, idx) => [
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

      const totalRow = [
        "",
        "",
        "",
        `${grupo.totalRolos} rolo(s) — Total`,
        "",
        formatarMetragem(grupo.totalMetragem),
        formatarPeso(grupo.totalPesoBruto),
        formatarPeso(grupo.totalPesoLiquido),
        "",
        "",
      ]
      body.push(totalRow)

      const fontSize = isLandscape ? 6 : 5.5
      ;(doc as any).autoTable({
        head,
        body,
        startY: y,
        styles: { fontSize, cellPadding: isLandscape ? 1.5 : 1.2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 10, left: margin, right: margin },
        tableLineColor: 200,
        tableLineWidth: 0.5,
        didParseCell(data: any) {
          if (data.row.index === body.length - 1) {
            data.cell.styles.fontStyle = "bold"
            data.cell.styles.fillColor = [219, 234, 254]
            data.cell.styles.halign = data.column.index === 0 || data.column.index === 1 || data.column.index === 2 ? "left" : "right"
          }
        },
        columnStyles: {
          0: { cellWidth: isLandscape ? 10 : 8, halign: "center" },
          4: { halign: "center" },
          8: { halign: "center" },
          9: { halign: "center" },
        },
      })

      doc.save(`romaneio-${numero}.pdf`)
      toast.success(`PDF do romaneio ${numero} gerado!`)
    } catch (err) {
      toast.error("Erro ao gerar PDF: " + (err instanceof Error ? err.message : "desconhecido"))
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
                <Button onClick={handleSearch} disabled={!selectedId || loadingData} className="gap-2">
                  <Search size={16} />
                  Buscar
                </Button>
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
                <Button
                  onClick={gerarPdfsSelecionados}
                  disabled={selectedRomaneios.size === 0 || gerandoPdf}
                  className="gap-2"
                >
                  {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  PDF ({selectedRomaneios.size})
                </Button>
              )}
            </div>
          </div>

          {loadingData ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : grupos.length > 0 ? (
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
                            {grupo.rolos.map((rolo, idx) => (
                              <tr
                                key={rolo.codigo_rolo}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-3 py-2 text-sm text-slate-500 text-center font-mono text-[12px]">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">
                                  {rolo.codigo_rolo}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono text-[12px]">
                                  {rolo.produto}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={rolo.narrativa}>
                                  {rolo.narrativa}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                  {rolo.lote_produto}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">
                                  {formatarMetragem(rolo.quantidade)}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">
                                  {formatarPeso(rolo.peso_bruto)}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">
                                  {formatarPeso(rolo.peso_liquido)}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center">
                                  {rolo.largura ? `${rolo.largura.toFixed(1)}m` : "—"}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-center font-mono">
                                  {rolo.endereco_rolo || "—"}
                                </td>
                              </tr>
                            ))}
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
