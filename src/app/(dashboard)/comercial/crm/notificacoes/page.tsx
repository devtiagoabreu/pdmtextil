"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellRing, Check, CheckCheck, ExternalLink, Loader2, MessageSquare, UserPlus, XCircle } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type Notificacao = {
  id: number
  titulo: string
  mensagem: string | null
  tipo: string
  lida: boolean
  link: string | null
  metadados: Record<string, any> | null
  createdAt: string
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  lead_novo: <UserPlus size={16} className="text-green-500" />,
  lead_finalizado: <CheckCheck size={16} className="text-blue-500" />,
  mensagem: <MessageSquare size={16} className="text-emerald-500" />,
  erro: <XCircle size={16} className="text-red-500" />,
}

export default function NotificacoesPage() {
  const router = useRouter()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todas" | "naoLidas">("todas")

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = filtro === "naoLidas" ? "?naoLidas=true" : ""
      const res = await fetch(`/api/crm/notificacoes${params}`)
      const data = await res.json()
      setNotificacoes(Array.isArray(data.lista) ? data.lista : [])
      setNaoLidas(data.naoLidas || 0)
    } catch {
      setNotificacoes([])
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function marcarLida(id: number) {
    try {
      await fetch(`/api/crm/notificacoes/${id}/ler`, { method: "PATCH" })
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
      setNaoLidas((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  async function marcarTodasLidas() {
    try {
      await Promise.all(
        notificacoes.filter((n) => !n.lida).map((n) =>
          fetch(`/api/crm/notificacoes/${n.id}/ler`, { method: "PATCH" })
        )
      )
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
      setNaoLidas(0)
    } catch {}
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    if (diff < 172800000) return "Ontem"
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  const info = getInfoContent("/comercial/crm/notificacoes")

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Notificações{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe novos leads, leads finalizados e alertas do WhatsApp
          </p>
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasLidas}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro("todas")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filtro === "todas"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltro("naoLidas")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 ${
            filtro === "naoLidas"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Bell size={12} />
          Não lidas
          {naoLidas > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-blue-500 text-[10px] font-medium text-white px-1">
              {naoLidas}
            </span>
          )}
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BellRing className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">
              {filtro === "naoLidas" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}
            </p>
          </div>
        ) : (
          notificacoes.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.lida) marcarLida(n.id) }}
              className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                n.lida
                  ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  : "border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {TIPO_ICON[n.tipo] || <Bell size={16} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {n.titulo}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  {n.mensagem && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {n.mensagem}
                    </p>
                  )}
                  {n.link && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(n.link!)
                      }}
                      className="mt-1.5 text-[10px] text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 font-medium"
                    >
                      <ExternalLink size={10} /> Ver detalhes
                    </button>
                  )}
                </div>
                {!n.lida && (
                  <button
                    onClick={(e) => { e.stopPropagation(); marcarLida(n.id) }}
                    className="shrink-0 p-1 text-slate-400 hover:text-blue-600"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
