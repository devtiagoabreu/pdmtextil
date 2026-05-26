"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, FileText, Pencil, Trash2, Link as LinkIcon, Download, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  PENDENTE:       { label: "Pendente",       classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  AGUARDANDO_INFO:{ label: "Aguard. Info",   classes: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  EM_DESENVOLVIMENTO: { label: "Em Desenvolvimento", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  APROVADO:       { label: "Aprovado",       classes: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400" },
  REPROVADO:      { label: "Reprovado",      classes: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  EM_PRODUCAO:    { label: "Em Produção",    classes: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" },
  CONCLUIDO:      { label: "Concluído",      classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

const TIPO_CONFIG: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM:      "Desenvolvimento Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Desenvolvimento Beneficiamento",
}

const SEGMENTOS_LABELS: Record<string, string> = {
  UNIFORME_CORPORATIVO: "Uniforme Corporativo",
  LENCOL_HOSPITALAR: "Lençol Hospitalar",
  LENCOL_CAMA_RESIDENCIAL: "Lençol de Cama Residencial",
  ROUPA_INTIMA: "Roupa Íntima",
  ROUPA_BANHO: "Roupa de Banho",
  ROUPA_MODA: "Roupa Moda",
  CALCADO: "Calçado",
  LINHA_MESA: "Linha de Mesa",
  COLCHAO: "Colchão",
  FORRO_MODA: "Forro de Moda",
  ESTOFADO_MOVEIS: "Estofado de Móveis",
  CORTINA: "Cortina",
  BAG: "Bag / Bolsas",
  ACESSORIOS: "Acessórios",
  DECORACAO: "Decoração",
  INDUSTRIAL: "Industrial",
  OUTROS: "Outros",
}

const TECNOLOGIAS_LABELS: Record<string, string> = {
  ANTIBACTERIANO: "Antibacteriano",
  ANTIFLAMAS: "Antiflamas",
  ANTIODOR: "Antiodor",
  ANTI_PILLING: "Anti-pilling",
  PROTECAO_UV: "Proteção UV",
  RESPIRABILIDADE: "Respirabilidade",
  SECAGEM_RAPIDA: "Secagem Rápida",
  TERMOREGULACAO: "Termorregulação",
  IMPERMEAVEL: "Impermeável",
  RESISTENTE_ABRASÃO: "Resistente à Abrasão",
  SOFT_TOUCH: "Soft Touch",
  HYDRARE: "HydraRe",
  OUTROS: "Outros",
}

const ABRASAO_LABELS: Record<string, string> = {
  BAIXA: "Baixa (escritório, uso leve)",
  MEDIA: "Média (logística, uso moderado)",
  ALTA: "Alta (indústria, uso intenso)",
  MUITO_ALTA: "Muito Alta (uso extremo)",
}

const BRILHO_LABELS: Record<string, string> = {
  FOSCO: "Fosco",
  SEMI_FOSCO: "Semi-Fosco",
  BRILHANTE: "Brilhante",
  ALTO_BRILHO: "Alto Brilho",
}

const TOQUE_LABELS: Record<string, string> = {
  SECO: "Seco / Técnico",
  MACIO: "Macio",
  SUAVE: "Suave",
  ESTRUTURADO: "Estruturado",
}

const CORES_LABELS: Record<string, string> = {
  SOLIDAS: "Cores Sólidas",
  ESTAMPADAS: "Estampadas",
  FANTASIA: "Fantasia",
  DESENVOLVIMENTO_EXCLUSIVO: "Desenvolvimento Exclusivo",
}

const PRECO_LABELS: Record<string, string> = {
  ECONOMICO: "Econômico",
  INTERMEDIARIO: "Intermediário",
  PREMIUM: "Premium",
}

const TIPO_TECIDO_LABELS: Record<string, string> = {
  PLANO: "Tecido Plano",
  JACQUARD: "Jacquard",
  MALHA: "Malha",
}

const LIGAMENTO_LABELS: Record<string, string> = {
  TAFETAN: "Taftan",
  SARJA: "Sarja",
  RIBANA: "Ribana",
  CETIM: "Cetim",
  OXFORD: "Oxford",
  DOBRADINHA: "Dobradinha",
  MALHA: "Malha",
  OUTROS: "Outros",
}

const TIPO_FIBRA_LABELS: Record<string, string> = {
  POLIESTER: "Poliéster",
  ALGODAO: "Algodão",
  LINHO: "Linho",
  VISCOSE: "Viscose",
  MODAL: "Modal",
  ACRILICO: "Acrílico",
  NYLON: "Nylon",
  LINHA_RECICLADA: "Linha Reciclada",
  ORGANICO: "Orgânico",
  OUTROS: "Outros",
}

const TIPOS_ACABAMENTO_LABELS: Record<string, string> = {
  SANFORIZADO: "Sanforizado",
  MERCERIZADO: "Mercerizado",
  RESINADO: "Resinado",
  AMACIADO: "Amaciado",
  ESFOLHADO: "Esfoliado",
  BRILHO: "Brilho",
  FOSCO: "Fosco",
  TEXTURIZADO: "Texturizado",
  ESTAMPADO: "Estampado",
  TINGIDO: "Tingido",
  OUTROS: "Outros",
}

async function fetchSolicitacao(id: string) {
  const res = await fetch(`/api/solicitacoes/${id}?t=${Date.now()}`)
  if (!res.ok) throw new Error("Falha ao carregar solicitação")
  return res.json()
}

export default function DetalheSolicitacaoPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const id = params.id as string
  const [mounted, setMounted] = useState(false)
  const [produtos, setProdutos] = useState<any[]>([])
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)
  const [novoStatus, setNovoStatus] = useState("")
  const [statusLoading, setStatusLoading] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (id) {
      fetch(`/api/solicitacoes/${id}/produtos-cru`)
        .then(r => r.json())
        .then(data => setProdutos(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [id])

  const { data: sol, isLoading, error, refetch } = useQuery({
    queryKey: ["solicitacao", id],
    queryFn: () => fetchSolicitacao(id),
    enabled: mounted && !!id,
    staleTime: 0,
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/solicitacoes/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Solicitação excluída com sucesso")
      setDeleteTarget(null)
      router.push("/comercial/solicitacoes")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const STATUS_TRANSICOES = [
    { value: "AGUARDANDO_INFO", label: "Aguardando Info" },
    { value: "EM_DESENVOLVIMENTO", label: "Em Desenvolvimento" },
    { value: "APROVADO", label: "Aprovar" },
    { value: "REPROVADO", label: "Reprovar" },
    { value: "EM_PRODUCAO", label: "Em Produção" },
    { value: "CONCLUIDO", label: "Concluir" },
  ]

  const handleStatusChange = async () => {
    if (!novoStatus) return
    setStatusLoading(true)
    try {
      const res = await fetch(`/api/solicitacoes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success("Status alterado com sucesso!")
      refetch()
      setNovoStatus("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar status")
    } finally {
      setStatusLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !sol) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Erro ao carregar solicitação</p>
        <Link href="/comercial/solicitacoes" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar à lista
        </Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[sol.status] ?? { label: sol.status, classes: "bg-slate-100 text-slate-600" }
  const briefing = sol.briefing || {}

  const handleExportPdf = () => {
    const filename = `${sol.id}-${(sol.projeto || "sem-projeto").replace(/[^a-zA-Z0-9]/g, "-")}-${new Date(sol.createdAt).toISOString().split("T")[0]}.pdf`
    const printContent = document.getElementById("ficha-impressao")
    if (!printContent) return
    
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            h2 { font-size: 18px; margin: 20px 0 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            h3 { font-size: 14px; margin: 15px 0 8px; color: #555; }
            .header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .field { margin-bottom: 8px; }
            .label { font-weight: bold; color: #555; font-size: 12px; }
            .value { font-size: 13px; }
            .section { margin: 20px 0; }
            .links { list-style: none; }
            .links li { margin: 5px 0; }
            .links a { color: #0066cc; text-decoration: none; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const renderSegmentos = (segmentos: string[]) => {
    if (!segmentos || !Array.isArray(segmentos)) return "—"
    return segmentos.map((s: string) => SEGMENTOS_LABELS[s] || s).join(", ")
  }

  const renderTecnologias = (tecnologias: string[]) => {
    if (!tecnologias || !Array.isArray(tecnologias)) return "—"
    return tecnologias.map((t: string) => TECNOLOGIAS_LABELS[t] || t).join(", ")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/solicitacoes"
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <button
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:underline"
        >
          Atualizar
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            #{sol.id} - {sol.cliente}
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{sol.projeto || "Sem projeto"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
          <div className="flex items-center gap-1">
            <Select value={novoStatus} onValueChange={(v) => v && setNovoStatus(v)}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Alterar status..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_TRANSICOES
                  .filter(s => s.value !== sol.status)
                  .map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleStatusChange}
              disabled={!novoStatus || statusLoading}
              className="h-8 text-xs whitespace-nowrap"
            >
              {statusLoading ? "..." : "OK"}
            </Button>
          </div>
          <Link
            href={`/comercial/solicitacoes/${id}/editar`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Pencil size={14} />
            Editar
          </Link>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800"
          >
            <Download size={14} />
            Exportar PDF
          </button>
          <button
            onClick={() => {
              setDeleteTarget({ id: sol.id, anexos: sol.anexos })
              setDeleteBlocked(false)
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      </div>

      <div className="print:block" id="ficha-impressao">
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                Dados Comerciais
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Tipo</p>
                  <p className="font-medium">{TIPO_CONFIG[sol.tipo] || sol.tipo}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Cliente</p>
                  <p className="font-medium">{sol.cliente || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">CNPJ</p>
                  <p className="font-medium">{sol.cnpj || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Projeto</p>
                  <p className="font-medium">{sol.projeto || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Prazo Desejado</p>
                  <p className="font-medium">
                    {sol.prazoDesejado ? new Date(sol.prazoDesejado).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Criado em</p>
                  <p className="font-medium">
                    {sol.createdAt ? new Date(sol.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-lg font-semibold mb-4">Briefing Técnico</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">1. Aplicação / Uso Final</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Segmentos:</span> <span className="font-medium">{renderSegmentos(briefing.aplicacao?.segmentos)}</span></div>
                    {briefing.aplicacao?.descricaoAplicacao && <div><span className="text-slate-500">Descrição:</span> <span className="font-medium">{briefing.aplicacao.descricaoAplicacao}</span></div>}
                    {briefing.aplicacao?.outrosSegmentos && <div><span className="text-slate-500">Outros Segmentos:</span> <span className="font-medium">{briefing.aplicacao.outrosSegmentos}</span></div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">2. Requisitos Técnicos</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Tipo Tecido:</span> <span className="font-medium">{TIPO_TECIDO_LABELS[briefing.requisitosTecnicos?.tipoTecido] || briefing.requisitosTecnicos?.tipoTecido || "—"}</span></div>
                    <div><span className="text-slate-500">Ligamento:</span> <span className="font-medium">{LIGAMENTO_LABELS[briefing.requisitosTecnicos?.ligamento] || briefing.requisitosTecnicos?.ligamento || "—"}</span></div>
                    <div><span className="text-slate-500">Composição:</span> <span className="font-medium">{briefing.requisitosTecnicos?.composicao || "—"}</span></div>
                    <div><span className="text-slate-500">Tipo Fibra:</span> <span className="font-medium">{Array.isArray(briefing.requisitosTecnicos?.tipoFibra) ? briefing.requisitosTecnicos.tipoFibra.map((f: string) => TIPO_FIBRA_LABELS[f] || f).join(", ") : "—"}</span></div>
                    <div><span className="text-slate-500">Gramatura:</span> <span className="font-medium">{briefing.requisitosTecnicos?.gramaturaMinima || "—"} - {briefing.requisitosTecnicos?.gramaturaMaxima || "—"} g/m²</span></div>
                    <div><span className="text-slate-500">Largura:</span> <span className="font-medium">{briefing.requisitosTecnicos?.larguraMinima || "—"} - {briefing.requisitosTecnicos?.larguraMaxima || "—"} cm</span></div>
                    <div><span className="text-slate-500">Densidade Urdume:</span> <span className="font-medium">{briefing.requisitosTecnicos?.densidadeUrdume || "—"}</span></div>
                    <div><span className="text-slate-500">Densidade Trama:</span> <span className="font-medium">{briefing.requisitosTecnicos?.densidadeTrama || "—"}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">3. Tecnologias</h3>
                  <div className="text-sm space-y-1">
                    <div><span className="text-slate-500">Tecnologias:</span> <span className="font-medium">{renderTecnologias(briefing.tecnologias?.requeridas)}</span></div>
                    {briefing.tecnologias?.outrasTecnologias && <div><span className="text-slate-500">Outras:</span> <span className="font-medium">{briefing.tecnologias.outrasTecnologias}</span></div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">4. Performance</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Resistência Abrasão:</span> <span className="font-medium">{ABRASAO_LABELS[briefing.performance?.resistenciaAbrasao] || briefing.performance?.resistenciaAbrasao || "—"}</span></div>
                    {briefing.performance?.resistenciaLavagem !== undefined && <div><span className="text-slate-500">Resist. Lavagem:</span> <span className="font-medium">{briefing.performance.resistenciaLavagem ? "Sim" : "Não"}</span></div>}
                    {briefing.performance?.resistenciaSecagem !== undefined && <div><span className="text-slate-500">Resist. Secagem:</span> <span className="font-medium">{briefing.performance.resistenciaSecagem ? "Sim" : "Não"}</span></div>}
                    {briefing.performance?.resistenciaPassagem !== undefined && <div><span className="text-slate-500">Resist. Passagem:</span> <span className="font-medium">{briefing.performance.resistenciaPassagem ? "Sim" : "Não"}</span></div>}
                    {briefing.performance?.outrasPerformances && <div><span className="text-slate-500">Outras:</span> <span className="font-medium">{briefing.performance.outrasPerformances}</span></div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">5. Acabamento</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Tipos:</span> <span className="font-medium">{Array.isArray(briefing.acabamento?.tipos) ? briefing.acabamento.tipos.map((t: string) => TIPOS_ACABAMENTO_LABELS[t] || t).join(", ") : "—"}</span></div>
                    <div><span className="text-slate-500">Brilho:</span> <span className="font-medium">{BRILHO_LABELS[briefing.acabamento?.nivelBrilho] || briefing.acabamento?.nivelBrilho || "—"}</span></div>
                    <div><span className="text-slate-500">Toque:</span> <span className="font-medium">{TOQUE_LABELS[briefing.acabamento?.toque] || briefing.acabamento?.toque || "—"}</span></div>
                    {briefing.acabamento?.textura && <div><span className="text-slate-500">Textura:</span> <span className="font-medium">{briefing.acabamento.textura}</span></div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">6. Cores</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Tipo:</span> <span className="font-medium">{CORES_LABELS[briefing.cores?.tipo] || briefing.cores?.tipo || "—"}</span></div>
                    {briefing.cores?.paletaPreferencial && <div><span className="text-slate-500">Paleta:</span> <span className="font-medium">{briefing.cores.paletaPreferencial}</span></div>}
                    {briefing.cores?.coresEspecificas && <div><span className="text-slate-500">Cores Específicas:</span> <span className="font-medium">{briefing.cores.coresEspecificas}</span></div>}
                    {briefing.cores?.lavabilidadeCores && <div><span className="text-slate-500">Lavabilidade:</span> <span className="font-medium">{briefing.cores.lavabilidadeCores}</span></div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">7. Comercial</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Target Preço:</span> <span className="font-medium">{PRECO_LABELS[briefing.comercial?.targetPreco] || briefing.comercial?.targetPreco || "—"}</span></div>
                    {briefing.comercial?.quantidadeEstimada && <div><span className="text-slate-500">Quantidade:</span> <span className="font-medium">{briefing.comercial.quantidadeEstimada}</span></div>}
                    {briefing.comercial?.prazoEntrega && <div><span className="text-slate-500">Prazo Entrega:</span> <span className="font-medium">{briefing.comercial.prazoEntrega}</span></div>}
                    {briefing.comercial?.observacoes && <div className="col-span-2"><span className="text-slate-500">Observações:</span> <span className="font-medium">{briefing.comercial.observacoes}</span></div>}
                  </div>
                </div>
              </div>
            </div>

            {sol.anexos && sol.anexos.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LinkIcon size={20} className="text-blue-500" />
                  Links e Referências
                </h2>
                <ul className="space-y-3">
                  {sol.anexos.map((anexo: any) => (
                    <li key={anexo.id} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                      <a 
                        href={anexo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                      >
                        {anexo.titulo || anexo.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} />
            Produtos Desenvolvidos
          </h2>
          {produtos.length > 0 ? (
            <div className="space-y-3">
              {produtos.map(p => (
                <Link
                  key={p.id}
                  href={`/cadastros/produto-cru/${p.id}`}
                  className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{p.codigoPdm} — {p.descricao}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status: <span className={`font-medium ${
                          p.status === "APROVADO" ? "text-green-600" :
                          p.status === "EM_PRODUCAO" ? "text-blue-600" :
                          "text-slate-600"
                        }`}>{p.status}</span>
                      </p>
                    </div>
                    <Pencil size={14} className="text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum produto cadastrado para esta solicitação.</p>
          )}
        </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Histórico
        </h2>
        {sol.historicoComunicacao && sol.historicoComunicacao.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sol.historicoComunicacao.map((h: any, idx: number) => (
              <div key={idx} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                <p className="text-sm font-medium">{h.acao}</p>
                {h.mensagens && h.mensagens.length > 0 && (
                  <ul className="text-xs text-slate-600 mt-1">
                    {h.mensagens.map((m: string, i: number) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  {h.usuario} - {h.data ? new Date(h.data).toLocaleString("pt-BR") : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sem histórico</p>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir solicitação?"}
        message={deleteBlocked
          ? "Esta solicitação possui cadastros vinculados e não pode ser excluída."
          : deleteTarget?.anexos?.length > 0
            ? `Esta solicitação possui ${deleteTarget?.anexos?.length} link(s) anexado(s). Ao excluir, os links também serão removidos. Continuar?`
            : `Tem certeza que deseja excluir esta solicitação?`}
        subMessage={deleteBlocked
          ? "Remova ou desvincule os registros associados antes de excluir. Entre em contato com o administrador para mais informações."
          : undefined}
        confirmLabel={deleteBlocked ? "OK" : "Excluir"}
        variant={deleteBlocked ? "warning" : "danger"}
        loading={deleteLoading}
        onConfirm={() => {
          if (deleteBlocked) {
            setDeleteTarget(null)
            setDeleteBlocked(false)
            return
          }
          handleDelete()
        }}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteBlocked(false)
        }}
      />
    </div>
  )
}