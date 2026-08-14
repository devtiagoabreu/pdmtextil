"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ViagemForm } from "@/components/crm/viagem-form"
import type { InvestimentoLinha } from "@/lib/crm/viagem"

export default function NovaViagemPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [form, setForm] = useState<any>({
    titulo: "",
    descricao: "",
    destinoCidade: "",
    destinoUf: "",
    dataInicio: "",
    dataFim: "",
    status: "PLANEJADA",
  })
  const [investimentos, setInvestimentos] = useState<InvestimentoLinha[]>([])
  const [saving, setSaving] = useState(false)

  function setField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) {
      toast.error("O título da viagem é obrigatório")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/viagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dataInicio: form.dataInicio || null,
          dataFim: form.dataFim || null,
          destinoUf: form.destinoUf || null,
          investimentos: investimentos
            .filter((i) => i.valor !== "" || i.observacao !== "")
            .map((i) => ({
              tipo: i.tipo,
              valor: i.valor !== "" ? Number(i.valor) : null,
              observacao: i.observacao,
            })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao criar viagem")
      }
      const viagem = await res.json()
      toast.success("Viagem criada")
      router.push(`/comercial/crm/viagens/${viagem.id}`)
    } catch (err: any) {
      toast.error(err.message)
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nova Viagem{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Planejar viagem e investimentos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ViagemForm
          form={form}
          setField={setField}
          investimentos={investimentos}
          setInvestimentos={setInvestimentos}
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Salvando..." : "Criar Viagem"}
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
