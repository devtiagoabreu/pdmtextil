"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, FileText, ArrowUp, LayoutGrid, List } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { gerarSolicitacaoAmostraPdf } from "@/lib/gerar-solicitacao-amostra-pdf"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"
import Link from "next/link"

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
  dados?: Record<string, string> | null
  produtoCodigo: string
  produtoDescricao: string
  tipoAmostra: string
  acabamentoDescricao?: string | null
  solicitacaoDesenvolvimentoId?: number | null
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
  const { getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("AMOSTRA")

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
          dados: a.dados,
          produtoCodigo: a.produtoCodigo,
          produtoDescricao: a.produtoDescricao,
        },
        produtoCruId: a.produtoCruId,
        solicitacaoDesenvolvimentoId: a.solicitacaoDesenvolvimentoId,
      })
    } catch {
    } finally {
      setGerando(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Amostras{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {lista?.length || 0} amostra(s)
          </p>
        </div>
        <Link
          href="/amostras/kanban"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LayoutGrid size={16} />
          Kanban
        </Link>
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <List className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma amostra encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  {aba === "acabamento" && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Acabamento</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lista.map((a) => {
                  const isFoco = focoId === a.id
                  return (
                    <tr
                      key={`${a.tipoAmostra}-${a.id}`}
                      ref={isFoco ? focoRef : undefined}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isFoco ? "ring-2 ring-purple-500/40 bg-purple-50 dark:bg-purple-950/20" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">#{a.id}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-xs text-slate-400">{a.produtoCodigo}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{a.produtoDescricao}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{a.descricao || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{
                          backgroundColor: hexToRgba(getStatusColor(a.status), 0.15),
                          color: getStatusColor(a.status),
                        }}>
                          {getStatusLabel(a.status)}
                        </span>
                      </td>
                      {aba === "acabamento" && (
                        <td className="px-4 py-3 text-sm text-slate-500">{a.acabamentoDescricao || "—"}</td>
                      )}
                      <td className="px-4 py-3 text-sm text-slate-500">{a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">{a.motivoAprovacao || "—"}</td>
                      <td className="px-4 py-3">
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
