"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useStatuses } from "@/hooks/use-statuses"

export default function DetalheOportunidadePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const { statuses } = useStatuses("OPORTUNIDADE")
  const [oportunidade, setOportunidade] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [statusValue, setStatusValue] = useState("")

  useEffect(() => {
    fetch(`/api/crm/oportunidades/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setOportunidade(data)
        setStatusValue(data.status)
      })
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

  async function handleStatusSave() {
    try {
      const res = await fetch(`/api/crm/oportunidades/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      })
      if (!res.ok) throw new Error("Erro ao atualizar")
      setOportunidade((prev: any) => ({ ...prev, status: statusValue }))
      setEditingStatus(false)
      toast.success("Status atualizado")
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  function formatarMoeda(valor: string | null | undefined) {
    if (!valor) return "-"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
  }

  const currentStatus = statuses.find(s => s.nome === oportunidade?.status)

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
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{oportunidade.titulo}{info && <InfoButton content={info} />}</h1>
            {editingStatus ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={statusValue}
                  onChange={e => setStatusValue(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                >
                  {statuses.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
                <button onClick={handleStatusSave} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600"><Check size={14} /></button>
                <button onClick={() => { setEditingStatus(false); setStatusValue(oportunidade.status) }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setEditingStatus(true)} className="group relative">
                <span
                  className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: currentStatus?.cor || "#64748b", backgroundColor: `${currentStatus?.cor || "#64748b"}20` }}
                >
                  {currentStatus?.nome || oportunidade.status}
                </span>
                <Pencil size={12} className="absolute -top-1 -right-2 opacity-0 group-hover:opacity-100 text-slate-400" />
              </button>
            )}
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
