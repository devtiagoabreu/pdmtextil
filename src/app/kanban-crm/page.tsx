"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useStatuses } from "@/hooks/use-statuses"
import { KanbanSkeleton } from "@/components/crm/kanban-column"
import LeadsKanban from "@/components/crm/leads-kanban"
import OportunidadesKanban from "@/components/crm/oportunidades-kanban"
import PessoasKanban from "@/components/crm/pessoas-kanban"
import PropostasKanban from "@/components/crm/propostas-kanban"
import TarefasKanban from "@/components/crm/tarefas-kanban"
import VisitasKanban from "@/components/crm/visitas-kanban"
import CampanhasKanban from "@/components/crm/campanhas-kanban"
import { Minimize2, Loader2 } from "lucide-react"

const CHANNEL = "kanban-crm-sync"

const TIPO_ROTULO: Record<string, string> = {
  LEAD: "Leads",
  OPORTUNIDADE: "Oportunidades",
  PESSOA: "Pessoas",
  PROPOSTA: "Propostas",
  TAREFA: "Tarefas",
  VISITA: "Visitas",
  CAMPANHA: "Campanhas",
}

const API_ENDPOINTS: Record<string, string> = {
  LEAD: "/api/crm/leads",
  OPORTUNIDADE: "/api/crm/oportunidades",
  PESSOA: "/api/crm/pessoas",
  PROPOSTA: "/api/crm/propostas",
  TAREFA: "/api/crm/tarefas",
  VISITA: "/api/crm/visitas",
  CAMPANHA: "/api/crm/campanhas",
}

export default function CRMKanbanStandalonePage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 size={24} className="animate-spin text-slate-400" /></div>}><CRMKanbanStandaloneContent /></Suspense>
}

function CRMKanbanStandaloneContent() {
  const searchParams = useSearchParams()
  const tipo = searchParams.get("tipo") || "LEAD"
  const channelRef = useRef<BroadcastChannel | null>(null)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL)
    channelRef.current = channel
    channel.onmessage = (event) => {
      if (event.data.type === "reattach") {
        window.close()
      }
    }
    channel.onmessageerror = () => {}
    return () => channel.close()
  }, [])

  useEffect(() => {
    setLoading(true)
    const endpoint = API_ENDPOINTS[tipo]
    if (!endpoint) { setLoading(false); return }
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tipo])

  const handleReattach = () => {
    channelRef.current?.postMessage({ type: "reattach" })
    window.close()
  }

  function renderKanban() {
    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
    switch (tipo) {
      case "LEAD": return <LeadsKanban leads={data} />
      case "OPORTUNIDADE": return <OportunidadesKanban oportunidades={data} />
      case "PESSOA": return <PessoasKanban pessoas={data} />
      case "PROPOSTA": return <PropostasKanban propostas={data} />
      case "TAREFA": return <TarefasKanban tarefas={data} />
      case "VISITA": return <VisitasKanban visitas={data} />
      case "CAMPANHA": return <CampanhasKanban campanhas={data} />
      default: return <p className="text-slate-400 text-center py-10">Tipo inválido</p>
    }
  }

  return (
    <div className="flex flex-col h-screen animate-fade-in bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between shrink-0 px-6 pt-4 pb-2">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
          Kanban — {TIPO_ROTULO[tipo] || tipo}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Arraste os cards para mover
          </span>
          <button
            onClick={handleReattach}
            className="inline-flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            title="Recolocar kanban na aplicação"
          >
            <Minimize2 size={14} /> Recolocar na aplicação
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col px-6 pb-4">
        {renderKanban()}
      </div>
    </div>
  )
}
