"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import {
  ArrowLeft, Pencil, Check, X, Trash2,
  Building2, Star, StarOff, Mail, Phone, Smartphone,
} from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

export default function ContatoDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const [contato, setContato] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [empresas, setEmpresas] = useState<any[]>([])

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/crm/contatos/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setContato(data)
        setForm(data)
      })
      .catch(() => toast.error("Erro ao carregar contato"))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    if (!editing) return
    fetch("/api/crm/pessoas")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEmpresas(data) })
      .catch(() => {})
  }, [editing])

  async function handleSave() {
    try {
      const body = { ...form }
      if (body.empresaId) body.empresaId = parseInt(body.empresaId)

      const res = await fetch(`/api/crm/contatos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      setContato(updated)
      setForm(updated)
      setEditing(false)
      toast.success("Contato atualizado")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/contatos/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Contato excluído")
      router.push("/comercial/crm/contatos")
    } catch {
      toast.error("Erro ao excluir contato")
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!contato) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Contato não encontrado</p>
        <Link href="/comercial/crm/contatos" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  function empresaNome(c: any) {
    return c.empresaRazaoSocial || c.empresaNomeFantasia || c.empresaNome || `Empresa #${c.empresaId}`
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{contato.nome}{info && <InfoButton content={info} />}</h1>
            {contato.principal && (
              <Star size={16} className="text-amber-400 fill-amber-400" title="Contato principal" />
            )}
          </div>
          <p className="text-sm text-slate-500">{contato.cargo || "—"}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                <Check size={14} /> Salvar
              </button>
              <button onClick={() => { setEditing(false); setForm(contato) }} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline">
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Dados do Contato</h2>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Pessoa (Negócio)</label>
              <select
                value={form.empresaId || ""}
                onChange={e => setForm((p: any) => ({ ...p, empresaId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione...</option>
                {empresas.map((e: any) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.razaoSocial || e.nomeFantasia || e.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
              <input type="text" value={form.nome || ""} onChange={e => setForm((p: any) => ({ ...p, nome: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cargo</label>
                <input type="text" value={form.cargo || ""} onChange={e => setForm((p: any) => ({ ...p, cargo: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={form.email || ""} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefone</label>
                <input type="text" value={form.telefone || ""} onChange={e => setForm((p: any) => ({ ...p, telefone: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Celular</label>
                <input type="text" value={form.celular || ""} onChange={e => setForm((p: any) => ({ ...p, celular: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp</label>
                <input type="text" value={form.whatsapp || ""} onChange={e => setForm((p: any) => ({ ...p, whatsapp: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-principal"
                checked={form.principal || false}
                onChange={e => setForm((p: any) => ({ ...p, principal: e.target.checked }))}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit-principal" className="text-xs text-slate-500">Contato principal</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
              <textarea value={form.observacoes || ""} onChange={e => setForm((p: any) => ({ ...p, observacoes: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-0.5">Pessoa (Negócio)</p>
              <Link href={`/comercial/crm/pessoas/${contato.empresaId}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                <Building2 size={14} />
                {empresaNome(contato)}
              </Link>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Cargo</p>
              <p className="text-slate-900 dark:text-slate-200">{contato.cargo || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Principal</p>
              <p className="text-slate-900 dark:text-slate-200">
                {contato.principal ? (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Star size={14} className="fill-amber-400" /> Sim
                  </span>
                ) : "Não"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Email</p>
              <p className="text-slate-900 dark:text-slate-200">
                {contato.email ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    {contato.email}
                  </span>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Telefone</p>
              <p className="text-slate-900 dark:text-slate-200">
                {contato.telefone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    {contato.telefone}
                  </span>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Celular</p>
              <p className="text-slate-900 dark:text-slate-200">
                {contato.celular ? (
                  <span className="inline-flex items-center gap-1">
                    <Smartphone size={12} className="text-slate-400" />
                    {contato.celular}
                  </span>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">WhatsApp</p>
              <p className="text-slate-900 dark:text-slate-200">{contato.whatsapp || "—"}</p>
            </div>
            {contato.observacoes && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Observações</p>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{contato.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDelete}
        title="Excluir contato?"
        message={`Tem certeza que deseja excluir "${contato.nome}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
