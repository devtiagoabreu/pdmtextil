"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, RefreshCw, BarChart3, MessageSquare, Users, CheckCircle, Clock, Zap, AlertTriangle } from "lucide-react"

interface DashboardData {
  resumo: {
    totalConversas: number
    totalLeads: number
    taxaConclusao: number
    tempoMedioMinutos: number
    ativas24h: number
  }
  porEstado: Array<{ estado: string; count: number }>
  dropoff: Array<{ estado: string; count: number }>
  msgsPorDia: Array<{ dia: string; recebidas: number; enviadas: number }>
  topErros: Array<{ step: string; count: number }>
  dias: number
}

const ESTADO_LABELS: Record<string, string> = {
  SAUDACAO: "Saudacao",
  CONFIRMANDO_DADOS_CNPJ: "Confirmando CNPJ",
  AGUARDANDO_REPRESENTANTE: "Aguardando Rep.",
  HUMANO_ASSUMINDO: "Humano Assumindo",
  ENCERRADO: "Encerrado",
}

const ESTADO_COLORS: Record<string, string> = {
  SAUDACAO: "bg-blue-500",
  CONFIRMANDO_DADOS_CNPJ: "bg-orange-500",
  AGUARDANDO_REPRESENTANTE: "bg-purple-500",
  HUMANO_ASSUMINDO: "bg-emerald-500",
  ENCERRADO: "bg-green-600",
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function WhatsAppDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dias, setDias] = useState(7)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const autoRefreshRef = useRef(false)
  autoRefreshRef.current = autoRefresh

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/whatsapp-dashboard?dias=${dias}`)
      if (!res.ok) throw new Error("Erro ao buscar")
      const json = await res.json()
      setData(json)
    } catch {
      if (!autoRefreshRef.current) {
        toast.error("Erro ao carregar dashboard")
      }
    } finally {
      setLoading(false)
    }
  }, [dias])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const maxEstado = data ? Math.max(...data.porEstado.map((e: any) => e.count), 1) : 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard WhatsApp</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Metricas de conversao e desempenho do bot</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[7, 15, 30].map((d: any) => (
              <Button
                key={d}
                variant={dias === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDias(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw size={14} />
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={MessageSquare} label="Total Conversas" value={data.resumo.totalConversas} color="bg-blue-600" />
            <StatCard icon={Users} label="Leads Criados" value={data.resumo.totalLeads} color="bg-emerald-600" />
            <StatCard icon={CheckCircle} label="Taxa Conclusao" value={`${data.resumo.taxaConclusao}%`} color="bg-green-600" />
            <StatCard icon={Clock} label="Tempo Medio" value={`${data.resumo.tempoMedioMinutos}m`} color="bg-amber-600" />
            <StatCard icon={Zap} label="Ativos 24h" value={data.resumo.ativas24h} color="bg-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Conversas por Estado</h3>
                <div className="space-y-3">
                  {data.porEstado.map((e: any) => (
                    <div key={e.estado} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-32 truncate" title={e.estado}>
                        {ESTADO_LABELS[e.estado] || e.estado}
                      </span>
                      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ESTADO_COLORS[e.estado] || "bg-slate-400"} transition-all duration-500`}
                          style={{ width: `${(e.count / maxEstado) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-10 text-right">{e.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Drop-off por Estado</h3>
                {data.dropoff.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum drop-off detectado</p>
                ) : (
                  <div className="space-y-3">
                    {data.dropoff.map((e: any, i: any) => (
                      <div key={e.estado} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-32 truncate">
                          {ESTADO_LABELS[e.estado] || e.estado}
                        </span>
                        <div className="flex-1 h-5 bg-red-50 dark:bg-red-950/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full transition-all duration-500"
                            style={{ width: `${(e.count / maxEstado) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400 w-10 text-right">{e.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-3">Clientes que pararam em cada etapa (fora de Saudacao e Encerrado)</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Mensagens por Dia</h3>
                {data.msgsPorDia.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum dado disponivel</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 text-xs font-medium text-slate-500">Dia</th>
                          <th className="text-right py-2 text-xs font-medium text-slate-500">Recebidas</th>
                          <th className="text-right py-2 text-xs font-medium text-slate-500">Enviadas</th>
                          <th className="text-right py-2 text-xs font-medium text-slate-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.msgsPorDia.map((d: any) => (
                          <tr key={d.dia} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 text-slate-700 dark:text-slate-200">{new Date(d.dia + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                            <td className="py-2 text-right text-blue-600 dark:text-blue-400">{d.recebidas}</td>
                            <td className="py-2 text-right text-green-600 dark:text-green-400">{d.enviadas}</td>
                            <td className="py-2 text-right font-medium text-slate-900 dark:text-slate-50">{d.recebidas + d.enviadas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Top Erros</h3>
                {data.topErros.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle size={16} />
                    <p className="text-sm">Nenhum erro registrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.topErros.map((e: any) => (
                      <div key={e.step} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{ESTADO_LABELS[e.step] || e.step}</span>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{e.count}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
