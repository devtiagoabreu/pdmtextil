"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type Amostra = {
  id: number
  descricao?: string | null
  status: string
  motivoAprovacao?: string | null
  observacoes?: string | null
  data: string
  createdAt: string
  produtoCodigo: string
  produtoDescricao: string
  tipoAmostra: string
  acabamentoDescricao?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APROVADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REPROVADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function AmostrasPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [aba, setAba] = useState<"tecidoCru" | "acabamento">("tecidoCru")
  const [tecidoCru, setTecidoCru] = useState<Amostra[]>([])
  const [acabamento, setAcabamento] = useState<Amostra[]>([])
  const [loading, setLoading] = useState(true)

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

  const lista = aba === "tecidoCru" ? tecidoCru : acabamento

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
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={`${a.tipoAmostra}-${a.id}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm font-medium">
                    <span className="text-xs text-slate-400">{a.produtoCodigo}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{a.produtoDescricao}</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
