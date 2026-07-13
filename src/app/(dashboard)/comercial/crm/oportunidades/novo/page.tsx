"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { QuickCreatePessoa } from "@/components/crm/quick-create-pessoa"
import { QuickCreateLead } from "@/components/crm/quick-create-lead"
import { useStatuses } from "@/hooks/use-statuses"

export default function NovaOportunidadePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const { statuses } = useStatuses("OPORTUNIDADE")
  const [empresas, setEmpresas] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    valorEstimado: "",
    empresaId: "",
    leadId: "",
    responsavelId: "",
    dataFechamentoPrevista: "",
    probabilidade: "0",
    status: "",
  })

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function loadEmpresas() {
    try {
      const res = await fetch("/api/crm/pessoas")
      const data = await res.json()
      if (Array.isArray(data)) setEmpresas(data)
    } catch {}
  }

  async function loadLeads() {
    try {
      const res = await fetch("/api/crm/leads")
      const data = await res.json()
      if (Array.isArray(data)) setLeads(data)
    } catch {}
  }

  function handleEmpresaCreated(id: number) {
    loadEmpresas()
    setField("empresaId", String(id))
  }

  function handleLeadCreated(id: number) {
    loadLeads()
    setField("leadId", String(id))
  }

  useEffect(() => {
    async function load() {
      const [empresasRes, leadsRes, usuariosRes] = await Promise.allSettled([
        fetch("/api/crm/pessoas").then(r => r.json()),
        fetch("/api/crm/leads").then(r => r.json()),
        fetch("/api/usuarios").then(r => r.json()),
      ])
      if (empresasRes.status === "fulfilled" && Array.isArray(empresasRes.value)) setEmpresas(empresasRes.value)
      if (leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value)) setLeads(leadsRes.value)
      if (usuariosRes.status === "fulfilled" && Array.isArray(usuariosRes.value)) setUsuarios(usuariosRes.value)
    }
    load()
  }, [])

  useEffect(() => {
    if (statuses.length > 0 && !form.status) {
      setField("status", statuses[0].nome)
    }
  }, [statuses])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) {
      toast.error("Título é obrigatório")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/oportunidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          descricao: form.descricao || null,
          valorEstimado: form.valorEstimado ? form.valorEstimado : null,
          empresaId: form.empresaId ? parseInt(form.empresaId) : null,
          leadId: form.leadId ? parseInt(form.leadId) : null,
          responsavelId: form.responsavelId ? parseInt(form.responsavelId) : null,
          dataFechamentoPrevista: form.dataFechamentoPrevista || null,
          probabilidade: form.probabilidade ? parseInt(form.probabilidade) : 0,
          status: form.status,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar oportunidade")
      }
      toast.success("Oportunidade criada com sucesso")
      router.push("/comercial/crm/oportunidades")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm/oportunidades" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nova Oportunidade{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500">Cadastrar nova oportunidade de venda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setField("titulo", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Venda de malha 100% algodão"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pessoa (Negócio)
              <QuickCreatePessoa onCreated={handleEmpresaCreated} />
            </label>
            <select
              value={form.empresaId}
              onChange={e => setField("empresaId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {empresas.map(e => (
                <option key={e.id} value={String(e.id)}>{e.razaoSocial || e.nomeFantasia}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Lead
              <QuickCreateLead onCreated={handleLeadCreated} />
            </label>
            <select
              value={form.leadId}
              onChange={e => setField("leadId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {leads.map(l => (
                <option key={l.id} value={String(l.id)}>{l.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
            <select
              value={form.responsavelId}
              onChange={e => setField("responsavelId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {usuarios.map(u => (
                <option key={u.id} value={String(u.id)}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Estimado</label>
            <input
              type="number"
              step="0.01"
              value={form.valorEstimado}
              onChange={e => setField("valorEstimado", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="R$ 0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Previsão de Fechamento</label>
            <input
              type="date"
              value={form.dataFechamentoPrevista}
              onChange={e => setField("dataFechamentoPrevista", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Probabilidade (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.probabilidade}
              onChange={e => setField("probabilidade", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setField("status", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map(s => (
                <option key={s.id} value={s.nome}>{s.nome}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={e => setField("descricao", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes da oportunidade..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/comercial/crm/oportunidades"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  )
}
