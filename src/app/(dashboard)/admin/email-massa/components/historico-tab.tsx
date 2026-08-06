"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { matchesSearch } from "@/components/ui/list-filters"
import {
  CheckCircle2, XCircle, Clock, Search, RefreshCw, FileText,
} from "lucide-react"
import { exportPDFRelatorio } from "@/lib/export-utils"
import type { HistoricoData } from "../types"

function StatusBadge({ status, abertoEm }: { status: string; abertoEm: string | null }) {
  if (abertoEm) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 size={12} /> Lido
      </span>
    )
  }
  if (status === "enviado") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <Clock size={12} /> Enviado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle size={12} /> Falhou
    </span>
  )
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export function HistoricoTab() {
  const queryClient = useQueryClient()
  const [historicoSearch, setHistoricoSearch] = useState("")

  const { data: historico = null, isLoading: loadingHistorico } = useQuery<HistoricoData | null>({
    queryKey: ["email-massa-historico"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/historico")
      if (!res.ok) return null
      return res.json()
    },
  })

  const filteredEnvios = historico?.envios.filter((e: any) =>
    !historicoSearch || matchesSearch(e, historicoSearch)
  ) || []

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["email-massa-historico"] })
  }

  return (
    <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Histórico de Envios</h2>
          <div className="flex gap-2">
            {historico && (
              <Button variant="outline" size="sm" onClick={() => {
                exportPDFRelatorio({
                  title: "Relatório de Email em Massa",
                  period: `Exportado em ${new Date().toLocaleString("pt-BR")}`,
                  stats: {
                    Total: historico.stats.total,
                    Enviados: historico.stats.enviados,
                    Lidos: historico.stats.lidos,
                    Cliques: historico.stats.totalCliques,
                    Falhas: historico.stats.falhas,
                  },
                  tables: [{
                    headers: ["Status", "Email", "Nome", "Assunto", "Cliques", "Enviado em", "Aberto em"],
                    rows: filteredEnvios.map((e: any) => [
                      e.abertoEm ? "Lido" : e.status === "enviado" ? "Enviado" : "Falhou",
                      e.email,
                      e.nome || "-",
                      e.assunto,
                      e.totalCliques || 0,
                      formatDate(e.createdAt),
                      formatDate(e.abertoEm),
                    ]),
                  }],
                  filename: `relatorio-email-massa-${new Date().toISOString().split("T")[0]}`,
                  orientation: "landscape",
                })
              }} className="gap-1">
                <FileText size={14} /> Relatório PDF
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refresh} className="gap-1">
              <RefreshCw size={14} /> Atualizar
            </Button>
          </div>
        </div>

        {loadingHistorico ? (
          <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
        ) : historico ? (
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold mt-1">{historico.stats.total}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-500 uppercase tracking-wide">Enviados</p>
                <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">{historico.stats.enviados}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-500 uppercase tracking-wide">Lidos</p>
                <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-300">{historico.stats.lidos}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-500 uppercase tracking-wide">Cliques</p>
                <p className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-300">{historico.stats.totalCliques}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-500 uppercase tracking-wide">Falhas</p>
                <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-300">{historico.stats.falhas}</p>
              </div>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={historicoSearch}
                onChange={e => setHistoricoSearch(e.target.value)}
                placeholder="Buscar por email, nome ou assunto..."
                className="pl-9"
              />
            </div>

            {filteredEnvios.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                {historicoSearch ? "Nenhum envio encontrado para esta busca." : "Nenhum envio registrado ainda."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left font-medium p-2">Status</th>
                      <th className="text-left font-medium p-2">Email</th>
                      <th className="text-left font-medium p-2">Nome</th>
                      <th className="text-left font-medium p-2">Assunto</th>
                      <th className="text-center font-medium p-2 w-20">Cliques</th>
                      <th className="text-left font-medium p-2">Enviado em</th>
                      <th className="text-left font-medium p-2">Aberto em</th>
                      <th className="text-left font-medium p-2">Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnvios.map((e: any) => (
                      <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2">
                          <StatusBadge status={e.status} abertoEm={e.abertoEm} />
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">{e.email}</td>
                        <td className="p-2">{e.nome || "—"}</td>
                        <td className="p-2 text-slate-500 truncate max-w-[160px]">{e.assunto}</td>
                        <td className="p-2 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${e.totalCliques > 0 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                            {e.totalCliques || 0}
                          </span>
                        </td>
                        <td className="p-2 text-slate-500 text-xs">{formatDate(e.createdAt)}</td>
                        <td className="p-2 text-slate-500 text-xs">{formatDate(e.abertoEm)}</td>
                        <td className="p-2 text-red-500 text-xs max-w-[150px] truncate">{e.error || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">Nenhum envio registrado ainda.</p>
        )}
      </div>
    </div>
  )
}

export default HistoricoTab
