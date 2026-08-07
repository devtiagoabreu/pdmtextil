"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { RefreshCw, Plus, Pencil, Trash2, Clock, Send } from "lucide-react"
import { EnvioProgresso } from "./envio-progresso"
import type { Agendado, Disparo } from "../types"

function ScheduleButton({ agendado, onAgendar }: { agendado: Agendado; onAgendar: (a: Agendado, data: string) => void }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState("")

  const handleSchedule = () => {
    if (!data) { toast.error("Informe a data e hora"); return }
    onAgendar(agendado, new Date(data).toISOString())
    setOpen(false)
    setData("")
  }

  return (
    <>
      <Button variant="outline" size="xs" onClick={() => setOpen(true)} className="gap-1"><Clock size={12} /> Agendar</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl w-96" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Agendar Disparo</h3>
            <p className="text-sm text-slate-500 mb-3">{agendado.nome || agendado.assunto}</p>
            <Input type="datetime-local" value={data} onChange={e => setData(e.target.value)} className="mb-4" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSchedule}>Agendar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export interface AgendarTabProps {
  onCarregarNoEditor: (a: Agendado) => void
  onNovoDisparo: () => void
  onEnviarAgendado: (a: Agendado) => void
  disparoProgresso?: Disparo | null
}

export function AgendarTab({ onCarregarNoEditor, onNovoDisparo, onEnviarAgendado, disparoProgresso }: AgendarTabProps) {
  const queryClient = useQueryClient()

  const { data: agendados = [], isLoading: loadingAgendados } = useQuery<Agendado[]>({
    queryKey: ["email-massa-agendados"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/agendados")
      if (!res.ok) return []
      return res.json()
    },
  })

  const [agendadoFiltro, setAgendadoFiltro] = useState<string>("todos")

  useEffect(() => {
    fetch("/api/admin/email-massa/agendados/executar", { method: "POST" }).catch(console.error)
  }, [])

  const agendarExistente = async (a: Agendado, data: string) => {
    try {
      const res = await fetch(`/api/admin/email-massa/agendados/${a.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agendadoPara: data, status: "agendado" }),
      })
      if (res.ok) { toast.success("Disparo agendado!"); queryClient.invalidateQueries({ queryKey: ["email-massa-agendados"] }) }
    } catch { toast.error("Erro ao agendar") }
  }

  const cancelarAgendado = async (a: Agendado) => {
    try {
      const res = await fetch(`/api/admin/email-massa/agendados/${a.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelado" }),
      })
      if (res.ok) { toast.success("Disparo cancelado"); queryClient.invalidateQueries({ queryKey: ["email-massa-agendados"] }) }
    } catch { toast.error("Erro ao cancelar") }
  }

  const excluirAgendado = async (id: number) => {
    if (!confirm("Excluir este agendamento?")) return
    try {
      const res = await fetch(`/api/admin/email-massa/agendados/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Excluído"); queryClient.invalidateQueries({ queryKey: ["email-massa-agendados"] }) }
    } catch { toast.error("Erro ao excluir") }
  }

  const executarAgendamentos = async () => {
    try {
      const res = await fetch("/api/admin/email-massa/agendados/executar", { method: "POST" })
      const data = await res.json()
      if (data.executados > 0) toast.success(`${data.executados} disparo(s) executado(s)`)
      else toast.info("Nenhum agendamento pendente")
      queryClient.invalidateQueries({ queryKey: ["email-massa-agendados"] })
    } catch { toast.error("Erro ao verificar agendamentos") }
  }

  const filtered = agendados.filter((a: any) => agendadoFiltro === "todos" || a.status === agendadoFiltro)

  return (
    <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Programar Disparo</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={executarAgendamentos} className="gap-1">
              <RefreshCw size={14} /> Verificar Agora
            </Button>
            <Button size="sm" onClick={onNovoDisparo} className="gap-1">
              <Plus size={14} /> Novo Disparo
            </Button>
          </div>
        </div>

        <EnvioProgresso progresso={disparoProgresso ?? null} />

        <div className="flex gap-2">
          {["todos", "rascunho", "agendado", "enviado", "cancelado", "erro"].map((f: any) => (
            <button key={f} onClick={() => setAgendadoFiltro(f)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${agendadoFiltro === f ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              {f === "todos" ? "Todos" : f === "rascunho" ? "Rascunhos" : f === "agendado" ? "Agendados" : f === "enviado" ? "Enviados" : f === "cancelado" ? "Cancelados" : "Com Erro"}
            </button>
          ))}
        </div>

        {loadingAgendados ? (
          <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Nenhum disparo encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left font-medium p-2">Status</th>
                  <th className="text-left font-medium p-2">Nome</th>
                  <th className="text-left font-medium p-2">Assunto</th>
                  <th className="text-left font-medium p-2">Destinatários</th>
                  <th className="text-left font-medium p-2">Agendado para</th>
                  <th className="text-left font-medium p-2">Criado em</th>
                  <th className="text-right font-medium p-2 w-64">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any) => (
                  <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        a.status === "rascunho" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                        a.status === "agendado" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        a.status === "enviado" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        a.status === "cancelado" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {a.status === "rascunho" ? "Rascunho" : a.status === "agendado" ? "Agendado" : a.status === "enviado" ? "Enviado" : a.status === "cancelado" ? "Cancelado" : "Erro"}
                      </span>
                    </td>
                    <td className="p-2 font-medium">{a.nome || a.assunto}</td>
                    <td className="p-2 text-slate-500 truncate max-w-[200px]">{a.assunto}</td>
                    <td className="p-2 text-xs">{a.para === "lista" ? `${a.listas?.length || 0} lista(s)` : a.para}</td>
                    <td className="p-2 text-xs">{a.agendadoPara ? new Date(a.agendadoPara).toLocaleString("pt-BR") : "—"}</td>
                    <td className="p-2 text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("pt-BR")}</td>
                    <td className="p-2 text-right">
                      <div className="flex gap-1 justify-end">
                        {a.status === "rascunho" && (
                          <>
                            <Button variant="outline" size="xs" onClick={() => onCarregarNoEditor(a)} className="gap-1"><Pencil size={12} /> Editar</Button>
                            <ScheduleButton agendado={a} onAgendar={agendarExistente} />
                          </>
                        )}
                        {a.status === "agendado" && (
                          <>
                            <Button variant="outline" size="xs" onClick={() => onEnviarAgendado(a)} className="gap-1 text-blue-600">
                              <Send size={12} /> Enviar agora
                            </Button>
                            <Button variant="outline" size="xs" onClick={() => cancelarAgendado(a)} className="gap-1 text-yellow-600">Cancelar</Button>
                          </>
                        )}
                        {(a.status === "rascunho" || a.status === "cancelado" || a.status === "erro") && (
                          <Button variant="ghost" size="xs" onClick={() => excluirAgendado(a.id)} className="gap-1 text-red-500 hover:text-red-700"><Trash2 size={12} /></Button>
                        )}
                      </div>
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

export default AgendarTab
