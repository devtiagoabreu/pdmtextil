"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Megaphone, Calendar, Users, DollarSign, TrendingUp, Edit3, Loader2 } from "lucide-react"
import { toast } from "sonner"

const TIPO_LABELS: Record<string, string> = {
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  REDES: "Redes Sociais",
  EVENTO: "Evento",
}

const STATUS_OPTIONS = ["ATIVA", "PAUSADA", "CONCLUIDA"]

export default function CampanhaDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const [campanha, setCampanha] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/crm/campanhas/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setCampanha(data)
        setForm(data)
      })
      .catch(() => toast.error("Erro ao carregar campanha"))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/campanhas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orcamento: form.orcamento ? Number(form.orcamento) : null,
          custoAquisicao: form.custoAquisicao ? Number(form.custoAquisicao) : null,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCampanha(updated)
      setForm(updated)
      setEditing(false)
      toast.success("Campanha atualizada")
    } catch {
      toast.error("Erro ao atualizar campanha")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    )
  }

  if (!campanha) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Campanha não encontrada</p>
        <Link href="/comercial/crm/campanhas" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{campanha.nome}{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500">{TIPO_LABELS[campanha.tipo] || campanha.tipo}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          <Edit3 size={14} /> {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Detalhes</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Status: </span>
              {editing ? (
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs bg-white dark:bg-slate-900"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <span className="font-medium text-slate-900 dark:text-slate-200">{campanha.status}</span>
              )}
            </div>
            <div>
              <span className="text-slate-500">Tipo: </span>
              <span className="font-medium text-slate-900 dark:text-slate-200">{TIPO_LABELS[campanha.tipo] || campanha.tipo}</span>
            </div>
            {campanha.leadsGerados > 0 && (
              <div className="flex items-center gap-2">
                <Users size={14} className="text-slate-400" />
                <span className="text-slate-500">Leads gerados:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{campanha.leadsGerados}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Financeiro</h2>
          <div className="space-y-3 text-sm">
            {campanha.orcamento && (
              <div>
                <span className="text-slate-500">Orçamento: </span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {Number(campanha.orcamento).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            )}
            {campanha.custoAquisicao && (
              <div>
                <span className="text-slate-500">Custo de Aquisição: </span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {Number(campanha.custoAquisicao).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            )}
            {campanha.dataInicio && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-slate-500">Período:</span>
                <span className="text-slate-900 dark:text-slate-200">
                  {new Date(campanha.dataInicio).toLocaleDateString("pt-BR")}
                  {campanha.dataFim && ` — ${new Date(campanha.dataFim).toLocaleDateString("pt-BR")}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {campanha.descricao && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Descrição</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{campanha.descricao}</p>
        </div>
      )}

      {editing && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Editar Campanha</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
              <input
                type="text"
                value={form.nome || ""}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leads Gerados</label>
              <input
                type="number"
                value={form.leadsGerados || 0}
                onChange={(e) => setForm({ ...form, leadsGerados: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
