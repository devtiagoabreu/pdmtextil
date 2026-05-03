"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Pencil, Trash2, Printer } from "lucide-react"
import { toast } from "sonner"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  PENDENTE:       { label: "Pendente",       classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  EM_ANALISE:     { label: "Em Análise",     classes: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  AGUARDANDO_INFO:{ label: "Aguard. Info",   classes: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
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

async function fetchSolicitacao(id: string) {
  const res = await fetch(`/api/solicitacoes/${id}?t=${Date.now()}`)
  if (!res.ok) throw new Error("Falha ao carregar solicitação")
  return res.json()
}

export default function DetalheSolicitacaoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: sol, isLoading, error, refetch } = useQuery({
    queryKey: ["solicitacao", id],
    queryFn: () => fetchSolicitacao(id),
    enabled: mounted && !!id,
  })

  const deleteMutate = useMutation({
    mutationFn: () => fetch(`/api/solicitacoes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Solicitação excluída")
      router.push("/comercial/solicitacoes")
    },
    onError: () => toast.error("Erro ao excluir"),
  })

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

  const handleImprimir = () => {
    window.print()
  }

  const renderSegmentos = (segmentos: string[]) => {
    if (!segmentos || !Array.isArray(segmentos)) return "—"
    return segmentos.map(s => SEGMENTOS_LABELS[s] || s).join(", ")
  }

  const renderTecnologias = (tecnologias: string[]) => {
    if (!tecnologias || !Array.isArray(tecnologias)) return "—"
    return tecnologias.map(t => TECNOLOGIAS_LABELS[t] || t).join(", ")
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
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{sol.projeto || "Sem projeto"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
          <Link
            href={`/comercial/solicitacoes/${id}/editar`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Pencil size={14} />
            Editar
          </Link>
          <button
            onClick={handleImprimir}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Printer size={14} />
            Imprimir
          </button>
          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir esta solicitação?")) {
                deleteMutate.mutate()
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      </div>

      <div className="print:block" id="ficha-impressao">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                    {sol.prazoDesejado ? new Date(sol.prazoDesejado).toLocaleDateString("pt-BR") : "—"}
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
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">2. Requisitos Técnicos</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Tipo Tecido:</span> <span className="font-medium">{briefing.requisitosTecnicos?.tipoTecido || "—"}</span></div>
                    <div><span className="text-slate-500">Composição:</span> <span className="font-medium">{briefing.requisitosTecnicos?.composicao || "—"}</span></div>
                    <div><span className="text-slate-500">Gramatura:</span> <span className="font-medium">{briefing.requisitosTecnicos?.gramaturaMinima} - {briefing.requisitosTecnicos?.gramaturaMaxima} g/m²</span></div>
                    <div><span className="text-slate-500">Largura:</span> <span className="font-medium">{briefing.requisitosTecnicos?.larguraMinima} - {briefing.requisitosTecnicos?.larguraMaxima} cm</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">3. Tecnologias</h3>
                  <div className="text-sm">
                    <span className="font-medium">{renderTecnologias(briefing.tecnologias?.requeridas)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">4. Performance</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Resistência Abrasão:</span> <span className="font-medium">{ABRASAO_LABELS[briefing.performance?.resistenciaAbrasao] || briefing.performance?.resistenciaAbrasao || "—"}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">5. Acabamento</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Brilho:</span> <span className="font-medium">{BRILHO_LABELS[briefing.acabamento?.nivelBrilho] || briefing.acabamento?.nivelBrilho || "—"}</span></div>
                    <div><span className="text-slate-500">Toque:</span> <span className="font-medium">{TOQUE_LABELS[briefing.acabamento?.toque] || briefing.acabamento?.toque || "—"}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">6. Cores</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Tipo:</span> <span className="font-medium">{CORES_LABELS[briefing.cores?.tipo] || briefing.cores?.tipo || "—"}</span></div>
                    <div><span className="text-slate-500">Paleta:</span> <span className="font-medium">{briefing.cores?.paletaPreferencial || "—"}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">7. Comercial</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Target Preço:</span> <span className="font-medium">{PRECO_LABELS[briefing.comercial?.targetPreco] || briefing.comercial?.targetPreco || "—"}</span></div>
                    <div><span className="text-slate-500">Quantidade:</span> <span className="font-medium">{briefing.comercial?.quantidadeEstimada || "—"}</span></div>
                    <div><span className="text-slate-500">Prazo Entrega:</span> <span className="font-medium">{briefing.comercial?.prazoEntrega || "—"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
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
          </div>
        </div>
      </div>
    </div>
  )
}