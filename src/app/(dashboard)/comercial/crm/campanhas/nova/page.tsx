"use client"

import { useState } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, Megaphone, Loader2 } from "lucide-react"
import { toast } from "sonner"

const TIPO_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "REDES", label: "Redes Sociais" },
  { value: "EVENTO", label: "Evento" },
]

export default function NovaCampanhaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [form, setForm] = useState({
    nome: "",
    tipo: "WHATSAPP",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    orcamento: "",
    leadsGerados: 0,
    custoAquisicao: "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error("O nome da campanha é obrigatório")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/campanhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orcamento: form.orcamento ? Number(form.orcamento) : null,
          custoAquisicao: form.custoAquisicao ? Number(form.custoAquisicao) : null,
          dataInicio: form.dataInicio || null,
          dataFim: form.dataFim || null,
        }),
      })
      if (!res.ok) throw new Error("Erro ao criar campanha")
      toast.success("Campanha criada")
      router.push("/comercial/crm/campanhas")
    } catch {
      toast.error("Erro ao criar campanha")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nova Campanha{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Criar campanha de marketing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Nome da campanha"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Descrição da campanha"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Início</label>
            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Fim</label>
            <input
              type="date"
              value={form.dataFim}
              onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Orçamento (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.orcamento}
              onChange={(e) => setForm({ ...form, orcamento: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custo Aquisição (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.custoAquisicao}
              onChange={(e) => setForm({ ...form, custoAquisicao: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Salvando..." : "Criar Campanha"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
