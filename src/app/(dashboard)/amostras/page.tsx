"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, FileText, ArrowUp } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { gerarSolicitacaoAmostraPdf } from "@/lib/gerar-solicitacao-amostra-pdf"

type Amostra = {
  id: number
  produtoCruId?: number | null
  acabamentoId?: number | null
  descricao?: string | null
  status: string
  motivoAprovacao?: string | null
  observacoes?: string | null
  data: string
  createdAt: string
  links?: { url: string; descricao: string }[] | null
  quantidadeProduzida?: string | null
  produtoCodigo: string
  produtoDescricao: string
  tipoAmostra: string
  acabamentoDescricao?: string | null
  solicitacaoDesenvolvimentoId?: number | null
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADA: "Reprovado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APROVADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REPROVADA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function AmostrasPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const [aba, setAba] = useState<"tecidoCru" | "acabamento">("tecidoCru")
  const [tecidoCru, setTecidoCru] = useState<Amostra[]>([])
  const [acabamento, setAcabamento] = useState<Amostra[]>([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState<number | null>(null)
  const [focoId, setFocoId] = useState<number | null>(null)
  const focoRef = useRef<HTMLTableRowElement | null>(null)

  const focoAmostra = searchParams.get("focoAmostra")
  const focoTipo = searchParams.get("tipo")

  useEffect(() => {
    setLoading(true)
    fetch("/api/amostras")
      .then(r => r.json())
      .then(data => {
        setTecidoCru(data.tecidoCru || [])
        setAcabamento(data.acabamento || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (focoTipo === "ACABAMENTO") {
      setAba("acabamento")
    } else {
      setAba("tecidoCru")
    }
    if (focoAmostra) {
      setFocoId(parseInt(focoAmostra))
    }
  }, [focoAmostra, focoTipo])

  useEffect(() => {
    if (!loading && focoId !== null && focoRef.current) {
      focoRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      const timer = setTimeout(() => setFocoId(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [loading, focoId])

  const lista = aba === "tecidoCru" ? tecidoCru : acabamento

  async function handleGerarPdf(a: Amostra) {
    setGerando(a.id)
    try {
      await gerarSolicitacaoAmostraPdf({
        amostra: {
          id: a.id,
          tipoAmostra: a.tipoAmostra,
          descricao: a.descricao,
          status: a.status,
          observacoes: a.observacoes,
          data: a.data,
          links: a.links,
          quantidadeProduzida: a.quantidadeProduzida,
          produtoCodigo: a.produtoCodigo,
          produtoDescricao: a.produtoDescricao,
        },
        produtoCruId: a.produtoCruId,
        solicitacaoDesenvolvimentoId: a.solicitacaoDesenvolvimentoId,
      })
    } catch {
      // toast already handled inside utility
    } finally {
      setGerando(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Amostras{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe todas as amostras do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setAba("tecidoCru")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            aba === "tecidoCru"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Tecido Cru
          {!loading && (
            <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              {tecidoCru.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba("acabamento")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            aba === "acabamento"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Acabamento
          {!loading && (
            <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              {acabamento.length}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : lista.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma amostra encontrada</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Produto</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Descrição</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                {aba === "acabamento" && (
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Acabamento</th>
                )}
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Data</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Motivo</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4 w-32">Ação</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => {
                const isFoco = focoId === a.id
                return (
                <tr
                  key={`${a.tipoAmostra}-${a.id}`}
                  ref={isFoco ? focoRef : undefined}
                  className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isFoco ? "ring-2 ring-purple-500/40 bg-purple-50 dark:bg-purple-950/20" : ""}`}
                >
                  <td className="p-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {isFoco && (
                        <ArrowUp size={18} className="text-purple-500 animate-piscar shrink-0" />
                      )}
                      <div>
                        <span className="text-xs text-slate-400">{a.produtoCodigo}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{a.produtoDescricao}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{a.descricao || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] || "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </td>
                  {aba === "acabamento" && (
                    <td className="p-4 text-sm text-slate-500">{a.acabamentoDescricao || "—"}</td>
                  )}
                  <td className="p-4 text-sm text-slate-500">{a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="p-4 text-sm text-slate-500 max-w-[200px] truncate">{a.motivoAprovacao || "—"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleGerarPdf(a)}
                      disabled={gerando === a.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {gerando === a.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileText size={14} />
                      )}
                      {gerando === a.id ? "Gerando..." : "Solic. Amostra"}
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
