"use client"

import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ClipboardList,
  Inbox,
  InboxIcon,
  UserX,
  Clock,
  Loader2,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import {
  chamadoCategoriaLabel,
  chamadoPrioridadeLabel,
  chamadoStatusLabel,
  CHAMADO_STATUS_COLORS,
  CHAMADO_PRIORIDADE_COLORS,
} from "@/lib/chamados/constantes"
import type { ChamadoStatus, ChamadoPrioridade } from "@/lib/db/schema/chamados"

interface Recente {
  id: number
  titulo: string
  status: ChamadoStatus
  prioridade: ChamadoPrioridade
  categoria: string
  areaNome?: string | null
  solicitanteNome?: string | null
  createdAt: string
}

interface Fila {
  areaId: number | null
  areaNome: string
  total: number
  vencidos: number
}

interface DashboardData {
  totais: {
    abertos: number
    ativosPorStatus: Partial<Record<ChamadoStatus, number>>
    porPrioridade: Partial<Record<ChamadoPrioridade, number>>
    semResponsavel: number
    vencidosPrimeiraResposta: number
    vencidosResolucao: number
    resolvidosMes: number
    fechadosMes: number
    canceladosMes: number
  }
  porFila: Fila[]
  recentes: Recente[]
}

const badgeClass = (classes: string) =>
  `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes}`
const fallback = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

function formatarData(data?: string | null): string {
  if (!data) return "—"
  const d = new Date(data)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR")
}

export default function ChamadosDashboardPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["chamados-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/chamados/dashboard")
      if (!res.ok) throw new Error("Falha ao carregar dashboard")
      return res.json()
    },
  })

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  const { totais, porFila, recentes } = data

  const cards = [
    { label: "Abertos", value: totais.abertos, icon: Inbox },
    { label: "Sem responsável", value: totais.semResponsavel, icon: UserX, destaque: totais.semResponsavel > 0 },
    {
      label: "Vencidos 1ª resposta",
      value: totais.vencidosPrimeiraResposta,
      icon: Clock,
      destaque: totais.vencidosPrimeiraResposta > 0,
    },
    {
      label: "Vencidos resolução",
      value: totais.vencidosResolucao,
      icon: AlertTriangle,
      destaque: totais.vencidosResolucao > 0,
    },
    { label: "Resolvidos no mês", value: totais.resolvidosMes, icon: ClipboardList },
    { label: "Fechados no mês", value: totais.fechadosMes, icon: InboxIcon },
  ]

  const statuses = Object.entries(CHAMADO_STATUS_COLORS) as Array<[ChamadoStatus, string]>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Dashboard de Chamados
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visão geral de chamados, SLA, filas e responsáveis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, destaque }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  destaque ? "bg-red-100 dark:bg-red-900/30" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Icon
                  size={20}
                  className={destaque ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}
                />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
            </div>
            <span
              className={`text-2xl font-bold ${
                destaque ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-50"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Por status</h2>
          </div>
          <div className="p-4 space-y-2">
            {statuses
              .filter(([s]) => totais.ativosPorStatus[s])
              .map(([s, classes]) => (
                <div key={s} className="flex items-center justify-between gap-3">
                  <span className={badgeClass(classes)}>{chamadoStatusLabel(s)}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {totais.ativosPorStatus[s]}
                  </span>
                </div>
              ))}
            {Object.keys(totais.ativosPorStatus).length === 0 && (
              <div className="text-center text-sm text-slate-500 py-4">
                Nenhum chamado aberto
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Por prioridade</h2>
          </div>
          <div className="p-4 space-y-2">
            {(Object.entries(CHAMADO_PRIORIDADE_COLORS) as Array<[ChamadoPrioridade, string]>)
              .filter(([p]) => totais.porPrioridade[p])
              .map(([p, classes]) => (
                <div key={p} className="flex items-center justify-between gap-3">
                  <span className={badgeClass(classes)}>{chamadoPrioridadeLabel(p)}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {totais.porPrioridade[p]}
                  </span>
                </div>
              ))}
            {Object.keys(totais.porPrioridade).length === 0 && (
              <div className="text-center text-sm text-slate-500 py-4">
                Nenhum chamado aberto
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">Chamados por fila</h2>
        </div>
        {porFila.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum chamado aberto</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Fila
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Abertos
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Vencidos
                  </th>
                </tr>
              </thead>
              <tbody>
                {porFila.map((f) => (
                  <tr key={f.areaId ?? "sem"} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-50">
                      {f.areaNome}
                    </td>
                    <td className="p-4 text-sm text-slate-500">{f.total}</td>
                    <td className="p-4">
                      <span
                        className={`text-sm ${f.vencidos > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-500"}`}
                      >
                        {f.vencidos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">Recentes</h2>
        </div>
        {recentes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum chamado ainda</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Chamado
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Fila
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Prioridade
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Solicitante
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-4">
                      <Link href={`/chamados/${r.id}`}>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-50 hover:underline">
                          {r.titulo}
                        </span>
                      </Link>
                      <span className="block text-xs text-slate-400">
                        #{r.id} · {chamadoCategoriaLabel(r.categoria)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{r.areaNome || "—"}</td>
                    <td className="p-4">
                      <span
                        className={badgeClass(CHAMADO_PRIORIDADE_COLORS[r.prioridade] || fallback)}
                      >
                        {chamadoPrioridadeLabel(r.prioridade)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={badgeClass(CHAMADO_STATUS_COLORS[r.status] || fallback)}>
                        {chamadoStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{r.solicitanteNome || "—"}</td>
                    <td className="p-4 text-sm text-slate-500">{formatarData(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}