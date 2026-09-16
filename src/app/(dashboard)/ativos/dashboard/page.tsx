"use client"

import { useQuery } from "@tanstack/react-query"
import { Package, Layers, Calendar, ClipboardList, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface ProximaVistoria {
  id: number
  dataProgramada: string
  status: string
  ativoNome: string
  ativoCodigo: string
  tipoVistoriaNome: string
}

interface DashboardData {
  totais: {
    ativos: number
    categorias: number
    planos: number
    vistoriasMes: number
    pendentes: number
    atrasadas: number
  }
  proximas: ProximaVistoria[]
  compliancePorArea: Array<{ areaId: number | null; areaNome: string; total: number; conformes: number; percentual: number }>
}

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  NAO_CONFORME: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELADA: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

function formatarData(data?: string | null): string {
  if (!data) return "—"
  const [ano, mes, dia] = data.slice(0, 10).split("-")
  return `${dia}/${mes}/${ano}`
}

export default function AtivosDashboardPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["ativos-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/dashboard")
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

  const { totais, proximas, compliancePorArea } = data

  const cards = [
    { label: "Total de Ativos", value: totais.ativos, icon: Package },
    { label: "Categorias", value: totais.categorias, icon: Layers },
    { label: "Planos de Vistoria", value: totais.planos, icon: Calendar },
    { label: "Vistorias no Mês", value: totais.vistoriasMes, icon: ClipboardList },
    { label: "Pendentes", value: totais.pendentes, icon: Clock },
    { label: "Atrasadas", value: totais.atrasadas, icon: AlertTriangle, destaque: true },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Dashboard
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visão geral de ativos, vistorias e conformidade por área.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, destaque }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                destaque && value > 0
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}>
                <Icon size={20} className={destaque && value > 0 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"} />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
            </div>
            <span className={`text-2xl font-bold ${
              destaque && value > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-50"
            }`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">Compliance por Área</h2>
        </div>
        {compliancePorArea.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum dado de compliance</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Área</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Total</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Conformes</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Percentual</th>
              </tr>
            </thead>
            <tbody>
              {compliancePorArea.map((item) => (
                <tr key={item.areaId ?? item.areaNome} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-50">{item.areaNome}</td>
                  <td className="p-4 text-sm text-slate-500">{item.total}</td>
                  <td className="p-4 text-sm text-slate-500">{item.conformes}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.percentual >= 80 ? "bg-green-500" : item.percentual >= 50 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${item.percentual}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-10 text-right">
                        {item.percentual}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">Próximas vistorias</h2>
        </div>
        {proximas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma vistoria próxima</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Data Programada</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ativo</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Tipo de Vistoria</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {proximas.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatarData(v.dataProgramada)}</td>
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-50">
                      {v.ativoNome}
                      {v.ativoCodigo && <span className="text-slate-400 ml-2">{v.ativoCodigo}</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-500">{v.tipoVistoriaNome}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[v.status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {v.status}
                      </span>
                    </td>
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