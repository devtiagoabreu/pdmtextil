"use client"

import {Suspense, useState, useEffect} from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PageSkeleton } from "@/components/ui/page-skeleton"

type VinculoTipo = "none" | "pessoa" | "cliente"

function NovoContatoPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const empresaIdPrefill = searchParams.get("empresaId")
  const clienteIdPrefill = searchParams.get("clienteId")

  const [saving, setSaving] = useState(false)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [vinculoTipo, setVinculoTipo] = useState<VinculoTipo>(empresaIdPrefill ? "pessoa" : clienteIdPrefill ? "cliente" : "none")
  const [form, setForm] = useState({
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    celular: "",
    whatsapp: "",
    principal: false,
    observacoes: "",
    empresaId: empresaIdPrefill || "",
    clienteId: clienteIdPrefill || "",
  })

  useEffect(() => {
    fetch("/api/crm/pessoas")
      .then((r: any) => r.json())
      .then((data: any) => { if (Array.isArray(data)) setEmpresas(data) })
      .catch(() => toast.error("Erro ao carregar empresas"))
    fetch("/api/clientes")
      .then((r: any) => r.json())
      .then((data: any) => { if (Array.isArray(data)) setClientes(data) })
      .catch(() => toast.error("Erro ao carregar clientes"))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome,
        cargo: form.cargo,
        email: form.email,
        telefone: form.telefone,
        celular: form.celular,
        whatsapp: form.whatsapp,
        principal: form.principal,
        observacoes: form.observacoes,
      }
      if (vinculoTipo === "pessoa") payload.empresaId = form.empresaId
      if (vinculoTipo === "cliente") payload.clienteId = form.clienteId

      const res = await fetch("/api/crm/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar contato")
      }
      const data = await res.json()
      toast.success("Contato criado com sucesso")
      router.push(`/comercial/crm/contatos/${data.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Novo Contato</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vincular a</label>
          <select
            value={vinculoTipo}
            onChange={e => setVinculoTipo(e.target.value as VinculoTipo)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">Sem vínculo (criar órfão)</option>
            <option value="pessoa">Pessoa (Negócio)</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>

        {vinculoTipo === "pessoa" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pessoa (Negócio)</label>
            <select
              value={form.empresaId}
              onChange={e => setForm(p => ({ ...p, empresaId: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma pessoa...</option>
              {empresas.map((e: any) => (
                <option key={e.id} value={String(e.id)}>
                  {e.razaoSocial || e.nomeFantasia || e.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {vinculoTipo === "cliente" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente</label>
            <select
              value={form.clienteId}
              onChange={e => setForm(p => ({ ...p, clienteId: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
            <input
              type="text"
              value={form.cargo}
              onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
            <input
              type="text"
              value={form.telefone}
              onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Celular</label>
            <input
              type="text"
              value={form.celular}
              onChange={e => setForm(p => ({ ...p, celular: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="principal"
            checked={form.principal}
            onChange={e => setForm(p => ({ ...p, principal: e.target.checked }))}
            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="principal" className="text-sm text-slate-700 dark:text-slate-300">
            Contato principal
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/comercial/crm/contatos"
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Criar Contato
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NovoContatoPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NovoContatoPageContent />
    </Suspense>
  )
}
