"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Loader2, MapPin, Navigation, Clock, CheckCircle2, Calendar } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import type { PontoMapa } from "./viagem-rota-mapa"

const ViagemRotaMapa = dynamic(() => import("./viagem-rota-mapa"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />,
})

type VisitaCronograma = {
  id: number
  nome: string
  empresaId: number | null
  clienteId: number | null
  dataVisita: string
  hora: string | null
  tipo: string
  status: string
  enderecoTexto: string
  checkInTime: string | null
  checkOutTime: string | null
  latitude: number | null
  longitude: number | null
  localizacaoFonte: "checkin" | "endereco" | "geocodificada" | null
  km: number | null
}

type ViagemCronogramaData = {
  viagem: {
    id: number
    titulo: string
    descricao: string | null
    destinoCidade: string | null
    destinoUf: string | null
    dataInicio: string | null
    dataFim: string | null
    status: string
  }
  visitas: VisitaCronograma[]
  resumo: {
    total: number
    realizadas: number
    canceladas: number
    agendadas: number
    comLocalizacao: number
    comEndereco: number
    geocodificadas: number
    kmTotal: number
    kmSemLocalizacao: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em Andamento",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
}

const STATUS_BADGES: Record<string, string> = {
  REALIZADA: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  CANCELADA: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  EM_ANDAMENTO: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  AGENDADA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
}

interface ViagemCronogramaModalProps {
  viagemId: number | null
  viagemTitulo: string
  open: boolean
  onClose: () => void
}

export default function ViagemCronogramaModal({ viagemId, viagemTitulo, open, onClose }: ViagemCronogramaModalProps) {
  const { data, isLoading } = useQuery<ViagemCronogramaData>({
    queryKey: ["viagem-cronograma", viagemId],
    queryFn: () => fetch(`/api/crm/visitas/dashboard/viagem?viagemId=${viagemId}`).then((r: any) => r.json()),
    enabled: open && !!viagemId,
    retry: 1,
  })

  const visitas = data?.visitas ?? []
  const resumo = data?.resumo
  const pontos: PontoMapa[] = visitas
    .filter((v: any) => v.latitude != null && v.longitude != null)
    .map((v: any) => ({ id: v.id, latitude: v.latitude, longitude: v.longitude, rotulo: v.nome }))

  return (
    <Dialog
      open={open}
      onOpenChange={(opened) => {
        if (!opened) onClose()
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="flex-row items-start justify-between gap-2 p-4 pr-12 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Cronograma da Viagem
            </DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">{viagemTitulo}</p>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-4 flex-1 space-y-4">
          {isLoading && !data ? (
            <div role="status" className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-slate-400" size={24} />
              <span className="sr-only">Carregando cronograma da viagem...</span>
            </div>
          ) : (
            <>
              {data?.viagem && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {[data.viagem.destinoCidade, data.viagem.destinoUf].filter(Boolean).join(" - ")}
                  {data.viagem.dataInicio ? ` · ${formatData(data.viagem.dataInicio)}` : ""}
                  {data.viagem.dataFim ? ` a ${formatData(data.viagem.dataFim)}` : ""}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Chip icon={<Navigation size={14} />} label="Km total" value={formatKm(resumo?.kmTotal ?? 0)} tone="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50" />
                <Chip icon={<Calendar size={14} />} label="Visitas" value={`${resumo?.total ?? 0}`} tone="text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/60" />
                <Chip icon={<CheckCircle2 size={14} />} label="Realizadas" value={`${resumo?.realizadas ?? 0}`} tone="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50" />
                <Chip icon={<MapPin size={14} />} label="Com localização" value={`${resumo?.comLocalizacao ?? 0}`} tone="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50" />
              </div>

              {resumo && resumo.geocodificadas + resumo.comEndereco > 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Localização de {resumo.geocodificadas + resumo.comEndereco} visita(s) estimada pelo endereço (sem check-in).
                </p>
              )}

              {resumo && resumo.kmSemLocalizacao > 0 && (
                <p className="text-[11px] text-slate-400">
                  {resumo.kmSemLocalizacao} visita(s) sem endereço ficaram fora do trajeto no mapa.
                </p>
              )}

              <ViagemRotaMapa pontos={pontos} />

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Linha do tempo</h3>
                {visitas.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Nenhuma visita nesta viagem</p>
                ) : (
                  <ol className="space-y-0">
                    {visitas.map((v: any, i: number) => (
                      <li key={v.id} className="relative pl-9 pb-5 last:pb-0">
                        {i < visitas.length - 1 && (
                          <span className="absolute left-[13px] top-6 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                        )}
                        <span className="absolute left-0 top-0 flex items-center justify-center w-[26px] h-[26px] rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {i + 1}
                        </span>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/comercial/crm/visitas/${v.id}`}
                              onClick={onClose}
                              className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline truncate inline-flex items-center gap-1.5"
                            >
                              {v.nome}
                            </Link>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{formatData(v.dataVisita)}</span>
                              {v.hora && <span>{v.hora}</span>}
                              {v.checkInTime && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock size={11} />
                                  {formatHora(v.checkInTime)}
                                </span>
                              )}
                            </div>
                            {v.enderecoTexto && <p className="text-xs text-slate-400 mt-0.5 truncate">{v.enderecoTexto}</p>}
                            {v.localizacaoFonte === "geocodificada" || v.localizacaoFonte === "endereco" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                <MapPin size={10} />
                                Estimada pelo endereço
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_BADGES[v.status] || STATUS_BADGES.AGENDADA}`}>
                              {STATUS_LABELS[v.status] || v.status}
                            </span>
                            {i === 0 ? (
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">Partida</span>
                            ) : v.km != null ? (
                              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">+{formatKm(v.km)}</span>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Chip({
  icon, label, value, tone,
}: {
  icon: React.ReactNode; label: string; value: string; tone: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
      <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ${tone} mb-1.5`}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  )
}

function formatData(dia: string) {
  const d = new Date(dia + "T12:00:00")
  return isNaN(d.getTime()) ? dia : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function formatHora(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatKm(km: number) {
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`
}