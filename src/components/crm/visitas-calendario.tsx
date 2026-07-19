"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarDays, Navigation } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Vídeo",
  TELEFONE: "Telefone",
}

const TIPO_CORES: Record<string, string> = {
  PRESENCIAL: "bg-blue-500",
  VIDEO: "bg-purple-500",
  TELEFONE: "bg-emerald-500",
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay()

  const days: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

type Visita = {
  id: number
  dataVisita: string
  tipo: string
  status: string
  empresaNome: string | null
  clienteNome: string | null
  oportunidadeTitulo: string | null
  criadoPorNome: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
}

export default function VisitasCalendario({ visitas }: { visitas: Visita[] }) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  function buildGoogleMapsUrl(v: Visita) {
    const parts = [v.endereco, v.numero, v.complemento, v.bairro, v.cidade, v.uf].filter(Boolean)
    if (parts.length === 0) return null
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days = useMemo(() => getMonthDays(year, month), [year, month])

  const visitasPorDia = useMemo(() => {
    const map = new Map<string, Visita[]>()
    for (const v of visitas) {
      if (!v.dataVisita) continue
      const key = v.dataVisita
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(v)
    }
    return map
  }, [visitas])

  const hoje = new Date()
  const hojeStr = formatDateKey(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

  const mesAno = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const selectedVisitas = selectedDay
    ? visitasPorDia.get(formatDateKey(year, month, selectedDay)) || []
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 capitalize">
          {mesAno}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="px-2 py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[90px] bg-slate-50/50 dark:bg-slate-900/50" />
            }

            const dateKey = formatDateKey(year, month, day)
            const diaVisitas = visitasPorDia.get(dateKey) || []
            const isToday = dateKey === hojeStr
            const isSelected = day === selectedDay

            return (
              <div
                key={dateKey}
                className={`min-h-[90px] p-1.5 border-b border-r border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-inset ring-blue-400"
                    : isToday
                      ? "bg-blue-50/60 dark:bg-blue-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
                onClick={() => setSelectedDay(isSelected ? null : day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {day}
                  </span>
                  {diaVisitas.length > 0 && (
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {diaVisitas.length}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {diaVisitas.slice(0, 2).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-1 group cursor-pointer"
                      title={`${v.empresaNome || v.clienteNome || "Sem entidade"} - ${TIPO_LABELS[v.tipo] || v.tipo}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIPO_CORES[v.tipo] || "bg-slate-400"}`} />
                      <span
                        className="text-[10px] text-slate-600 dark:text-slate-400 truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/comercial/crm/visitas/${v.id}`)
                        }}
                      >
                        {v.empresaNome || v.clienteNome || "—"}
                      </span>
                      {buildGoogleMapsUrl(v) && (
                        <a
                          href={buildGoogleMapsUrl(v)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Abrir no Google Maps"
                        >
                          <Navigation size={9} className="text-emerald-500 shrink-0" />
                        </a>
                      )}
                    </div>
                  ))}
                  {diaVisitas.length > 2 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      +{diaVisitas.length - 2} mais
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedVisitas.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {selectedVisitas[0].dataVisita
                ? new Date(selectedVisitas[0].dataVisita + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "Visitas do dia"}
              {" — "}
              {selectedVisitas.length} visita(s)
            </h4>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {selectedVisitas.map((v) => (
              <div
                key={v.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/comercial/crm/visitas/${v.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${TIPO_CORES[v.tipo] || "bg-slate-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                      {v.empresaNome || v.clienteNome || "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {TIPO_LABELS[v.tipo] || v.tipo}
                      {v.oportunidadeTitulo && ` • ${v.oportunidadeTitulo}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {buildGoogleMapsUrl(v) && (
                    <a
                      href={buildGoogleMapsUrl(v)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                      title="Abrir no Google Maps"
                    >
                      <Navigation size={14} className="text-emerald-500" />
                    </a>
                  )}
                  <span className="text-xs text-slate-400">{v.criadoPorNome || ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
