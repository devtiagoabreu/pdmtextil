"use client"

import {Suspense, useState, useEffect} from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Building2, User, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { TipoEntidadeSelector } from "@/app/(dashboard)/comercial/crm/visitas/novo/components/tipo-entidade-selector"

type TipoEntidade = "CLIENTE" | "PESSOA" | "AVULSA"

function NovoContatoPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const empresaIdPrefill = searchParams.get("empresaId")
  const clienteIdPrefill = searchParams.get("clienteId")

  const [saving, setSaving] = useState(false)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [tipoEntidade, setTipoEntidade] = useState<TipoEntidade | "">(
    empresaIdPrefill ? "PESSOA" : clienteIdPrefill ? "CLIENTE" : ""
  )
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
      .catch(() => toast.error("Erro ao carregar pessoas"))
    fetch("/api/clientes")
      .then((r: any) => r.json())
      .then((data: any) => { if (Array.isArray(data)) setClientes(data) })
      .catch(() => toast.error("Erro ao carregar clientes"))
  }, [])

  function handleTrocar() {
    setTipoEntidade("")
    setForm(p => ({ ...p, empresaId: "", clienteId: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    if (tipoEntidade === "PESSOA" && !form.empresaId) {
      toast.error("Selecione uma pessoa")
      return
    }
    if (tipoEntidade === "CLIENTE" && !form.clienteId) {
      toast.error("Selecione um cliente")
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
      if (tipoEntidade === "PESSOA") payload.empresaId = form.empresaId
      if (tipoEntidade === "CLIENTE") payload.clienteId = form.clienteId

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

  const entidadeIcone =
    tipoEntidade === "CLIENTE" ? (
      <Building2 size={18} className="text-emerald-600" />
    ) : tipoEntidade === "AVULSA" ? (
      <User size={18} className="text-orange-600" />
    ) : (
      <UserCheck size={18} className="text-blue-600" />
    )

  const entidadeLabel =
    tipoEntidade === "CLIENTE"
      ? "Contato de Cliente"
      : tipoEntidade === "AVULSA"
        ? "Contato Avulso"
        : "Contato de Pessoa (Negócio)"

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Novo Contato</h1>
      </div>

      {!tipoEntidade && (
        <TipoEntidadeSelector
          onSelect={setTipoEntidade}
          title="A quem este contato pertence?"
          description="Selecione o tipo de vínculo para cadastrar o contato."
          labels={{
            clienteDesc: "Vincular a uma empresa cliente",
            pessoaDesc: "Vincular a uma pessoa (negócio)",
            avulsa: "Avulso",
            avulsaDesc: "Contato sem vínculo inicial",
          }}
        />
      )}

      {tipoEntidade && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {entidadeIcone}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {entidadeLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={handleTrocar}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
            >
              Trocar
            </button>
          </div>

          {tipoEntidade === "AVULSA" ? (
            <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 px-4 py-3 text-sm text-orange-700 dark:text-orange-300">
              Este contato será criado sem vínculo (avulso).
            </div>
          ) : tipoEntidade === "CLIENTE" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente *</label>
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
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pessoa (Negócio) *</label>
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
      )}
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
