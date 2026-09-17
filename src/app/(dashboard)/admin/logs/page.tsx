"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Loader2,
  ScrollText,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  Clock,
  User2,
  Filter,
} from "lucide-react"
import { getInfoContent } from "@/lib/info-content"
import { InfoButton } from "@/components/ui/info-button"
import type { QueryLogs } from "@/app/api/admin/logs/route"

const TIPO_BADGE: Record<string, string> = {
  ERRO: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  INFO: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  AVISO:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
}

const TIPO_LABEL: Record<string, string> = {
  ERRO: "Erro",
  INFO: "Info",
  AVISO: "Aviso",
}

const TIPOS = ["", "ERRO", "INFO", "AVISO"]

export default function LogsAuditoriaPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [pagina, setPagina] = useState(1)
  const [limite] = useState(20)
  const [tipo, setTipo] = useState("")
  const [busca, setBusca] = useState("")
  const [buscaAplicada, setBuscaAplicada] = useState("")

  const { data, isLoading, isError } = useQuery<QueryLogs>({
    queryKey: ["admin-logs", pagina, limite, tipo, buscaAplicada],
    queryFn: async () => {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: String(limite),
      })
      if (tipo) params.set("tipo", tipo)
      if (buscaAplicada) params.set("busca", buscaAplicada)
      const res = await fetch(`/api/admin/logs?${params}`)
      if (!res.ok) throw new Error("Erro ao carregar logs")
      return res.json()
    },
  })

  if (isError) {
    toast.error("Erro ao carregar logs de auditoria")
  }

  function aplicarBusca() {
    setPagina(1)
    setBuscaAplicada(busca)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <ScrollText className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Logs de Auditoria
            </h1>
            {info && <InfoButton content={info} />}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && aplicarBusca()}
            placeholder="Buscar por ação, descrição, entidade, usuário..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          {TIPOS.map((t) => (
            <button
              key={t || "todos"}
              onClick={() => {
                setTipo(t)
                setPagina(1)
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                tipo === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {t ? (TIPO_LABEL[t] ?? t) : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <th className="p-3 text-left font-semibold text-slate-700 dark:text-slate-300 w-20">
                  Tipo
                </th>
                <th className="p-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Ação / Descrição
                </th>
                <th className="p-3 text-left font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">
                  Entidade
                </th>
                <th className="p-3 text-left font-semibold text-slate-700 dark:text-slate-300 hidden lg:table-cell">
                  Usuário
                </th>
                <th className="p-3 text-left font-semibold text-slate-700 dark:text-slate-300 w-40">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.itens.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500 dark:text-slate-400">
                    Nenhum log encontrado.
                  </td>
                </tr>
              )}
              {data?.itens.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.total} {data.total === 1 ? "registro" : "registros"} · página {data.pagina} de{" "}
            {data.totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={data.pagina <= 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPagina((p) => p + 1)}
              disabled={data.pagina >= data.totalPaginas}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LogRow({ log }: { log: any }) {
  const [expandida, setExpandida] = useState(false)
  const tipoErro = log.tipo === "ERRO"
  const erro = log.erro || log.dados?.erro

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 align-top">
      <td className="p-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            TIPO_BADGE[log.tipo] ??
            "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          }`}
        >
          {log.tipo === "ERRO" ? (
            <AlertTriangle size={11} />
          ) : log.tipo === "AVISO" ? (
            <AlertTriangle size={11} />
          ) : (
            <FileText size={11} />
          )}
          {TIPO_LABEL[log.tipo] ?? log.tipo}
        </span>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">{log.acao}</span>
          {tipoErro && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={11} />
            </span>
          )}
        </div>
        <button
          onClick={() => setExpandida(!expandida)}
          className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
        >
          {expandida ? "Recolher" : "Ver descrição"}
        </button>
        {expandida && (
          <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            {log.descricao && <p>{log.descricao}</p>}
            {tipoErro && erro && <p className="text-red-600 dark:text-red-400">Erro: {erro}</p>}
            {log.dados && log.tipo === "INFO" && (
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1">
                {JSON.stringify(log.dados, null, 2)}
              </pre>
            )}
          </div>
        )}
      </td>
      <td className="p-3 hidden md:table-cell">
        <span className="text-slate-600 dark:text-slate-300">
          {log.entidade}
          {log.entidadeId ? ` #${log.entidadeId}` : ""}
        </span>
      </td>
      <td className="p-3 hidden lg:table-cell">
        <span className="text-slate-600 dark:text-slate-300">{log.usuarioNome}</span>
      </td>
      <td className="p-3 text-slate-500 dark:text-slate-400 text-xs w-40">
        {new Date(log.createdAt).toLocaleString("pt-BR")}
      </td>
    </tr>
  )
}
