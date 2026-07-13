"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Pencil, Check, X, Trash2, MessageSquare, Send, Loader2, Check as CheckIcon, CheckCheck } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

const STATUS_OPTIONS = ["NOVO", "CONTATADO", "QUALIFICADO", "CONVERTIDO", "PERDIDO"]
const ORIGEM_OPTIONS = ["SITE", "INDICACAO", "EVENTO", "PROSPECCAO", "LIGACAO", "WHATSAPP", "EMAIL", "OUTRO"]

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  CONTATADO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  QUALIFICADO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  CONVERTIDO: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
}

type Mensagem = {
  id: number
  mensagem: string
  tipo: "RECEBIDA" | "ENVIADA"
  status: string
  createdAt: string
}

export default function LeadDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const [textoMsg, setTextoMsg] = useState("")
  const [enviandoMsg, setEnviandoMsg] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/crm/leads/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setLead(data)
        setForm(data)
      })
      .catch(() => toast.error("Erro ao carregar lead"))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    if (!lead?.id) return
    fetch(`/api/crm/leads/${lead.id}/whatsapp`)
      .then(r => r.json())
      .then(data => {
        setMensagens(Array.isArray(data) ? data.reverse() : [])
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
  }, [lead?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  async function handleSave() {
    try {
      const res = await fetch(`/api/crm/leads/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      setLead(updated)
      setForm(updated)
      setEditing(false)
      toast.success("Lead atualizado")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/leads/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Lead excluído")
      router.push("/comercial/crm/leads")
    } catch {
      toast.error("Erro ao excluir lead")
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }

  async function enviarMensagem() {
    if (!textoMsg.trim()) return
    setEnviandoMsg(true)
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: textoMsg }),
      })
      if (!res.ok) throw new Error()
      const nova = await res.json()
      setMensagens(prev => [...prev, nova])
      setTextoMsg("")
    } catch {
      toast.error("Erro ao enviar mensagem")
    } finally {
      setEnviandoMsg(false)
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Lead não encontrado</p>
        <Link href="/comercial/crm/leads" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{lead.nome}{info && <InfoButton content={info} />}</h1>
            {lead.tipoPessoa && (
              <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                lead.tipoPessoa === "PF"
                  ? "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400"
                  : "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400"
              }`}>
                {lead.tipoPessoa === "PF" ? "PF" : "PJ"}
              </span>
            )}
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[lead.status] || ""}`}>
              {lead.status}
            </span>
          </div>
          {(lead.empresaNome || lead.tipoPessoa) && (
            <p className="text-sm text-slate-500">
              {lead.empresaNome}
              {lead.tipoPessoa && (lead.empresaNome ? " — " : "")}
              {lead.tipoPessoa === "PF" ? "Pessoa Física" : lead.tipoPessoa === "PJ" ? "Pessoa Jurídica" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                <Check size={14} /> Salvar
              </button>
              <button onClick={() => { setEditing(false); setForm(lead) }} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline">
                <X size={14} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => setShowDelete(true)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                <Trash2 size={14} /> Excluir
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Dados do Lead</h2>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
                <input type="text" value={form.nome || ""} onChange={e => setForm((p: any) => ({ ...p, nome: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                  <select value={form.tipoPessoa || ""} onChange={e => setForm((p: any) => ({ ...p, tipoPessoa: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    <option value="">—</option>
                    <option value="PF">PF</option>
                    <option value="PJ">PJ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input type="email" value={form.email || ""} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Celular</label>
                  <input type="text" value={form.celular || ""} onChange={e => setForm((p: any) => ({ ...p, celular: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Telefone</label>
                  <input type="text" value={form.telefone || ""} onChange={e => setForm((p: any) => ({ ...p, telefone: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Pessoa (Negócio)</label>
                  <input type="text" value={form.empresaNome || ""} onChange={e => setForm((p: any) => ({ ...p, empresaNome: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cargo</label>
                  <input type="text" value={form.cargo || ""} onChange={e => setForm((p: any) => ({ ...p, cargo: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Origem</label>
                  <select value={form.origem || "OUTRO"} onChange={e => setForm((p: any) => ({ ...p, origem: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    {ORIGEM_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select value={form.status || "NOVO"} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
                <textarea value={form.descricao || ""} onChange={e => setForm((p: any) => ({ ...p, descricao: e.target.value }))} rows={4} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Nome</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.nome || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Tipo</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.tipoPessoa === "PF" ? "PF" : lead.tipoPessoa === "PJ" ? "PJ" : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Celular</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.celular || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Telefone</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.telefone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Pessoa (Negócio)</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.empresaNome || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Cargo</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.cargo || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Origem</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.origem || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Status</p>
                <p className="text-slate-900 dark:text-slate-200">{lead.status || "—"}</p>
              </div>
              {lead.descricao && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-0.5">Descrição</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{lead.descricao}</p>
                </div>
              )}
              {lead.segmentoIa && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Segmento (IA)</p>
                  <p className="text-slate-900 dark:text-slate-200">{lead.segmentoIa}</p>
                </div>
              )}
              {lead.porteIa && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Porte (IA)</p>
                  <p className="text-slate-900 dark:text-slate-200">{lead.porteIa}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
            <MessageSquare size={16} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">WhatsApp</h2>
            {loadingMsgs && <Loader2 size={14} className="animate-spin text-slate-400" />}
          </div>
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-2 p-3">
              {mensagens.length === 0 && !loadingMsgs ? (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma mensagem</p>
              ) : (
                mensagens.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.tipo === "ENVIADA" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.tipo === "ENVIADA"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm"
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.mensagem}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.tipo === "ENVIADA" ? "text-blue-200" : "text-slate-400"}`}>
                        <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                        {msg.tipo === "ENVIADA" && (
                          msg.status === "ENVIADA" ? <CheckIcon size={12} /> : <CheckCheck size={12} />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textoMsg}
                  onChange={(e) => setTextoMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem() } }}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={enviarMensagem}
                  disabled={enviandoMsg || !textoMsg.trim()}
                  className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {enviandoMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Excluir lead?"
        message={`Tem certeza que deseja excluir "${lead.nome}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
