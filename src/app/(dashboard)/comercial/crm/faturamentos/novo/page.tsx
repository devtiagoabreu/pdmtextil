"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { DocumentoVendaForm } from "@/components/crm/documento-venda-form"
import { statusOptions, STATUS_FATURAMENTO, STATUS_FATURAMENTO_LABELS } from "@/lib/crm/documento-venda"
import type { ItemVendaLinha } from "@/lib/crm/documento-venda"

function NovaFaturamentoContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const [form, setForm] = useState({
    oportunidadeId: "",
    numero: "",
    dataEmissao: "",
    status: "EMITIDO",
    observacao: "",
    origem: "MANUAL",
    referenciaExterna: "",
  })
  const [itens, setItens] = useState<ItemVendaLinha[]>([{ produto: "", codigo: "", unidade: "METROS", unidadeOutra: "", quantidade: "", valorUnitario: "", valorTotal: "" }])
  const [oportunidades, setOportunidades] = useState<{ id: number; titulo: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const opId = searchParams.get("oportunidadeId")
    if (opId) setForm(prev => ({ ...prev, oportunidadeId: opId }))
  }, [searchParams])

  useEffect(() => {
    fetch("/api/crm/oportunidades")
      .then((r) => r.json())
      .then((data: { id: unknown; titulo: string }[]) => setOportunidades(Array.isArray(data) ? data.map((o) => ({ id: Number(o.id), titulo: o.titulo })) : []))
      .catch(() => setOportunidades([]))
  }, [])

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.oportunidadeId) {
      toast.error("Selecione a oportunidade")
      return
    }
    if (!itens.some((i) => i.produto.trim())) {
      toast.error("Adicione ao menos um item com produto")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/faturamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oportunidadeId: form.oportunidadeId,
          numero: form.numero,
          dataEmissao: form.dataEmissao || null,
          status: form.status,
          observacao: form.observacao,
          origem: form.origem,
          referenciaExterna: form.referenciaExterna,
          itens: itens
            .filter((i) => i.produto.trim())
            .map((i) => ({
              produto: i.produto,
              codigo: i.codigo,
              unidade: i.unidade,
              unidadeOutra: i.unidadeOutra,
              quantidade: i.quantidade !== "" ? Number(i.quantidade) : null,
              valorUnitario: i.valorUnitario !== "" ? Number(i.valorUnitario) : null,
              valorTotal: i.valorTotal !== "" ? Number(i.valorTotal) : null,
            })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao criar faturamento")
      }
      const faturamento = await res.json()
      toast.success("Faturamento criado")
      router.push(`/comercial/crm/faturamentos/${faturamento.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar faturamento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Novo Faturamento{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registrar retorno real da oportunidade</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <DocumentoVendaForm
          form={form}
          setField={setField}
          itens={itens}
          setItens={setItens}
          oportunidades={oportunidades}
          statusOptions={statusOptions(STATUS_FATURAMENTO, STATUS_FATURAMENTO_LABELS)}
          titulo="Dados do Faturamento"
          plural="faturamento"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Salvando..." : "Criar Faturamento"}
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

export default function NovaFaturamentoPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NovaFaturamentoContent />
    </Suspense>
  )
}