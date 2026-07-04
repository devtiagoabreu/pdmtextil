"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Target, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  QUALIFICACAO: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  PROPOSTA: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50 dark:text-yellow-400",
  NEGOCIACAO: "text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400",
  FECHADO_GANHO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  FECHADO_PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "Novo",
  QUALIFICACAO: "Qualificação",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  FECHADO_GANHO: "Ganho",
  FECHADO_PERDIDO: "Perdido",
}

export default function DetalheOportunidadePage() {
  const router = useRouter()
  const params = useParams()
  const [oportunidade, setOportunidade] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/crm/oportunidades/${params.id}`)
      .then(r => r.json())
      .then(data => setOportunidade(data))
      .catch(() => toast.error("Erro ao carregar oportunidade"))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/oportunidades/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Oportunidade excluída")
      router.push("/comercial/crm/oportunidades")
    } catch {
      toast.error("Erro ao excluir oportunidade")
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }

  function formatarMoeda(valor: string | null | undefined) {
    if (!valor) return "-"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!oportunidade) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Oportunidade não encontrada</p>
        <Link href="/comercial/crm/oportunidades" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{oportunidade.titulo}</h1>
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[oportunidade.status] || ""}`}>
              {STATUS_LABELS[oportunidade.status] || oportunidade.status}
            </span>
          </div>
          {oportunidade.empresaNome && (
            <p className="text-sm text-slate-500">{oportunidade.empresaNome}</p>
          )}
        </div>
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
          <Trash2 size={14} /> Excluir
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Detalhes</h2>
          <div className="space-y-3 text-sm">
            <Field label="Valor Estimado" value={formatarMoeda(oportunidade.valorEstimado)} />
            <Field label="Probabilidade" value={oportunidade.probabilidade != null ? `${oportunidade.probabilidade}%` : "—"} />
            <Field label="Previsão" value={oportunidade.dataFechamentoPrevista ? new Date(oportunidade.dataFechamentoPrevista).toLocaleDateString("pt-BR") : "—"} />
            <Field label="Responsável" value={oportunidade.responsavelNome || "—"} />
            <Field label="Empresa" value={oportunidade.empresaNome || "—"} />
            <Field label="Criado em" value={oportunidade.createdAt ? new Date(oportunidade.createdAt).toLocaleDateString("pt-BR") : "—"} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Contato</h2>
          {oportunidade.contato ? (
            <div className="space-y-3 text-sm">
              <Field label="Nome" value={oportunidade.contato.nome} />
              <Field label="Cargo" value={oportunidade.contato.cargo} />
              <Field label="Email" value={oportunidade.contato.email} />
              <Field label="Telefone" value={oportunidade.contato.telefone} />
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum contato vinculado</p>
          )}
        </div>
      </div>

      {oportunidade.descricao && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Descrição</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{oportunidade.descricao}</p>
        </div>
      )}

      {oportunidade.motivoPerda && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5">
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Motivo da Perda</h2>
          <p className="text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap">{oportunidade.motivoPerda}</p>
        </div>
      )}

      <ConfirmModal
        open={showDelete}
        title="Excluir oportunidade?"
        message={`Tem certeza que deseja excluir "${oportunidade.titulo}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 min-w-[100px]">{label}:</span>
      <span className="text-slate-900 dark:text-slate-200">{value || "—"}</span>
    </div>
  )
}
