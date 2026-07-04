"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2, Zap, Target, CalendarCheck, ListChecks, FileText, MessageSquare, FileCode2 } from "lucide-react"

const TIPO_ICON: Record<string, { icon: any; cor: string }> = {
  LEAD: { icon: Zap, cor: "text-amber-500 bg-amber-50 dark:bg-amber-950/50" },
  OPORTUNIDADE: { icon: Target, cor: "text-blue-500 bg-blue-50 dark:bg-blue-950/50" },
  VISITA: { icon: CalendarCheck, cor: "text-purple-500 bg-purple-50 dark:bg-purple-950/50" },
  TAREFA: { icon: ListChecks, cor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50" },
  PROPOSTA: { icon: FileText, cor: "text-rose-500 bg-rose-50 dark:bg-rose-950/50" },
  WHATSAPP: { icon: MessageSquare, cor: "text-green-500 bg-green-50 dark:bg-green-950/50" },
  SOLICITACAO: { icon: FileCode2, cor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50" },
}

const TIPO_LABEL: Record<string, string> = {
  LEAD: "Lead",
  OPORTUNIDADE: "Oportunidade",
  VISITA: "Visita",
  TAREFA: "Tarefa",
  PROPOSTA: "Proposta",
  WHATSAPP: "WhatsApp",
  SOLICITACAO: "Solicitação",
}

async function fetchTimeline(empresaId: string) {
  const res = await fetch(`/api/crm/timeline?empresaId=${empresaId}`)
  if (!res.ok) throw new Error("Falha ao carregar timeline")
  return res.json()
}

export default function CrmEmpresaTimeline({ empresaId }: { empresaId: string }) {
  const { data: eventos, isLoading } = useQuery({
    queryKey: ["crm-timeline", empresaId],
    queryFn: () => fetchTimeline(empresaId),
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!eventos?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Nenhum evento registrado na timeline</p>
      </div>
    )
  }

  return (
    <div className="relative pl-8 space-y-0">
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
      {eventos.map((evento: any) => {
        const config = TIPO_ICON[evento.tipo] || { icon: Zap, cor: "text-slate-500 bg-slate-50 dark:bg-slate-800" }
        const Icon = config.icon
        return (
          <div key={evento.id} className="relative pb-5 group">
            <div className={`absolute -left-8 p-1.5 rounded-full ${config.cor} ring-2 ring-white dark:ring-slate-900`}>
              <Icon size={14} />
            </div>
            <div className="pl-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                <span className="font-medium">{TIPO_LABEL[evento.tipo] || evento.tipo}</span>
                <span>•</span>
                <span>{new Date(evento.dataEvento).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{evento.descricao}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
