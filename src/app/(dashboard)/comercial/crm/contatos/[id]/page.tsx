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
import { useSession } from "next-auth/react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import type { ClienteResumo, Contato, ContatoFormState, EmpresaResumo, VinculoTipo } from "../types"

export default function ContatoDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUDO"
  const [contato, setContato] = useState<Contato | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ContatoFormState>({
    nome: "", cargo: "", email: "", telefone: "", celular: "", whatsapp: "",
    principal: false, observacoes: "", empresaId: null, clienteId: null,
  })
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([])
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [vinculoTipo, setVinculoTipo] = useState<VinculoTipo>("none")

  function contatoToForm(c: Contato): ContatoFormState {
    return {
      nome: c.nome,
      cargo: c.cargo ?? "",
      email: c.email ?? "",
      telefone: c.telefone ?? "",
      celular: c.celular ?? "",
      whatsapp: c.whatsapp ?? "",
      principal: c.principal,
      observacoes: c.observacoes ?? "",
      empresaId: c.empresaId,
      clienteId: c.clienteId,
    }
  }

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/crm/contatos/${params.id}`)
      .then((r) => r.json())
      .then((data: Contato) => {
        setContato(data)
        setForm(contatoToForm(data))
        setVinculoTipo(data.empresaId ? "pessoa" : data.clienteId ? "cliente" : "none")
      })
      .catch(() => toast.error("Erro ao carregar contato"))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    if (!editing) return
    fetch("/api/crm/pessoas")
      .then((r) => r.json())
      .then((data: EmpresaResumo[]) => { if (Array.isArray(data)) setEmpresas(data) })
      .catch(console.error)
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((data: ClienteResumo[]) => { if (Array.isArray(data)) setClientes(data) })
      .catch(console.error)
  }, [editing])

  async function handleSave() {
    try {
      const body: Record<string, unknown> = {
        nome: form.nome,
        cargo: form.cargo,
        email: form.email,
        telefone: form.telefone,
        celular: form.celular,
        whatsapp: form.whatsapp,
        principal: form.principal,
        observacoes: form.observacoes,
        empresaId: vinculoTipo === "pessoa" ? (form.empresaId || null) : null,
        clienteId: vinculoTipo === "cliente" ? (form.clienteId || null) : null,
      }

      const res = await fetch(`/api/crm/contatos/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated: Contato = await res.json()
      setContato(updated)
      setForm(contatoToForm(updated))
      setEditing(false)
      toast.success("Contato atualizado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
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

  function empresaNome(c: Contato) {
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
              <span title="Contato principal"><Star size={16} className="text-amber-400 fill-amber-400" /></span>
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
              <button onClick={() => { setEditing(false); if (contato) setForm(contatoToForm(contato)) }} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline">
                <X size={14} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                <Pencil size={14} /> Editar
              </button>
              {isAdmin && (
                <button onClick={() => setShowDelete(true)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                  <Trash2 size={14} /> Excluir
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Dados do Contato</h2>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vincular a</label>
              <select
                value={vinculoTipo}
                onChange={e => setVinculoTipo(e.target.value as VinculoTipo)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="none">Sem vínculo (órfão)</option>
                <option value="pessoa">Pessoa (Negócio)</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            {vinculoTipo === "pessoa" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Pessoa (Negócio)</label>
                <select
                  value={form.empresaId || ""}
                  onChange={e => setForm((p) => ({ ...p, empresaId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {e.razaoSocial || e.nomeFantasia || e.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {vinculoTipo === "cliente" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
                <select
                  value={form.clienteId || ""}
                  onChange={e => setForm((p) => ({ ...p, clienteId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
              <input type="text" value={form.nome || ""} onChange={e => setForm((p) => ({ ...p, nome: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cargo</label>
                <input type="text" value={form.cargo || ""} onChange={e => setForm((p) => ({ ...p, cargo: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={form.email || ""} onChange={e => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefone</label>
                <input type="text" value={form.telefone || ""} onChange={e => setForm((p) => ({ ...p, telefone: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Celular</label>
                <input type="text" value={form.celular || ""} onChange={e => setForm((p) => ({ ...p, celular: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp</label>
                <input type="text" value={form.whatsapp || ""} onChange={e => setForm((p) => ({ ...p, whatsapp: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-principal"
                checked={form.principal || false}
                onChange={e => setForm((p) => ({ ...p, principal: e.target.checked }))}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit-principal" className="text-xs text-slate-500">Contato principal</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
              <textarea value={form.observacoes || ""} onChange={e => setForm((p) => ({ ...p, observacoes: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-0.5">{contato.empresaId ? "Pessoa (Negócio)" : contato.clienteId ? "Cliente" : "Vínculo"}</p>
              {contato.empresaId ? (
                <Link href={`/comercial/crm/pessoas/${contato.empresaId}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                  <Building2 size={14} />
                  {empresaNome(contato)}
                </Link>
              ) : contato.clienteId ? (
                <Link href={`/comercial/crm/clientes/${contato.clienteId}`} className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-medium">
                  <Building2 size={14} />
                  {contato.clienteNome || `Cliente #${contato.clienteId}`}
                </Link>
              ) : (
                <span className="text-slate-400">—</span>
              )}
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
