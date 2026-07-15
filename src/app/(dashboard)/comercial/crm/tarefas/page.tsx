"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useState } from "react"
import { PlusCircle, ListChecks, CheckCircle2, Circle, Loader2, Table, Columns } from "lucide-react"
import CriarTarefaDialog from "./criar-dialog"
import TarefasKanban from "@/components/crm/tarefas-kanban"
import { FloatableKanban } from "@/components/crm/floatable-kanban"

async function fetchTarefas(filtro: string) {
  const params = new URLSearchParams()
  if (filtro === "hoje") params.set("hoje", "true")
  if (filtro === "pendentes") params.set("status", "PENDENTE")
  if (filtro === "concluidas") params.set("status", "CONCLUIDO")
  const res = await fetch(`/api/crm/tarefas?${params}`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const TIPO_LABELS: Record<string, string> = {
  LIGACAO: "Ligação",
  REUNIAO: "Reunião",
  PROPOSTA: "Proposta",
  TAREFA: "Tarefa",
}

const TIPO_CORES: Record<string, string> = {
  LIGACAO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  REUNIAO: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  PROPOSTA: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  TAREFA: "text-slate-600 bg-slate-50 dark:bg-slate-950/50 dark:text-slate-400",
}

const FILTROS = [
  { key: "todas", label: "Todas" },
  { key: "hoje", label: "Hoje" },
  { key: "pendentes", label: "Pendentes" },
  { key: "concluidas", label: "Concluídas" },
]

export default function TarefasPage() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [filtro, setFiltro] = useState("pendentes")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [modo, setModo] = useState<"tabela" | "kanban">("tabela")

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ["crm-tarefas", filtro],
    queryFn: () => fetchTarefas(filtro),
    retry: 1,
  })

  const concluirMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/crm/tarefas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONCLUIDO" }),
      })
      if (!res.ok) throw new Error("Falha ao concluir")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tarefas"] })
    },
  })

  const reabrirMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/crm/tarefas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDENTE", dataConclusao: null }),
      })
      if (!res.ok) throw new Error("Falha ao reabrir")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tarefas"] })
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Minhas Tarefas{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${tarefas?.length || 0} tarefa(s)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
            <button
              onClick={() => setModo("tabela")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modo === "tabela"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Table size={14} />
              Tabela
            </button>
            <button
              onClick={() => setModo("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modo === "kanban"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Columns size={14} />
              Kanban
            </button>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Nova Tarefa
          </button>
        </div>
      </div>

      {modo === "tabela" && (
      <>
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filtro === f.key ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !tarefas?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ListChecks className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tarefas.map((t: any) => {
              const isConcluida = t.status === "CONCLUIDO"
              return (
                <div
                  key={t.id}
                  className={`flex items-start gap-3 px-4 py-3.5 ${isConcluida ? "opacity-60" : ""}`}
                >
                  <button
                    onClick={() => isConcluida ? reabrirMutation.mutate(t.id) : concluirMutation.mutate(t.id)}
                    className="mt-0.5 shrink-0"
                    title={isConcluida ? "Reabrir" : "Concluir"}
                  >
                    {isConcluida ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isConcluida ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-200"}`}>
                      {t.titulo}
                    </p>
                    {t.descricao && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{t.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${TIPO_CORES[t.tipo] || ""}`}>
                        {TIPO_LABELS[t.tipo] || t.tipo}
                      </span>
                      {t.dataPrevista && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {new Date(t.dataPrevista + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {t.empresaNome && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                          {t.empresaNome}
                        </span>
                      )}
                    </div>
                  </div>
                  {concluirMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      </>
      )}

      {modo === "kanban" && (
        isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <FloatableKanban tipo="TAREFA"><TarefasKanban tarefas={tarefas || []} /></FloatableKanban>
        )
      )}

      <CriarTarefaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
