"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Pencil, Check, X, FileText, PlusCircle, Receipt, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useStatuses } from "@/hooks/use-statuses"
import { STATUS_FATURAMENTO_LABELS, STATUS_FATURAMENTO_CORES, STATUS_PEDIDO_VENDA_LABELS, STATUS_PEDIDO_VENDA_CORES } from "@/lib/crm/documento-venda"
import type { OportunidadeDetalhe, DocumentoVendaResumo } from "../types"

const PROPOSTA_STATUS: Record<string, { label: string; cor: string }> = {
  ENVIADA: { label: "Enviada", cor: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400" },
  ACEITA: { label: "Aceita", cor: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400" },
  RECUSADA: { label: "Recusada", cor: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400" },
  REVISAO: { label: "Em Revisão", cor: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400" },
}

function formatarMoedaProposta(valor: string | null | undefined) {
  if (!valor) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
}

function formatarValorTotal(lista: DocumentoVendaResumo[]) {
  const soma = (lista || []).reduce((acc, item) => acc + Number(item.total ?? 0), 0)
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(soma)
}

export default function DetalheOportunidadePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const { statuses } = useStatuses("OPORTUNIDADE")
  const [oportunidade, setOportunidade] = useState<OportunidadeDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [statusValue, setStatusValue] = useState("")

  useEffect(() => {
    fetch(`/api/crm/oportunidades/${params.id}`)
      .then((r) => r.json())
      .then((data: OportunidadeDetalhe) => {
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
      setOportunidade(prev => (prev ? { ...prev, status: statusValue } : prev))
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

  const currentStatus = statuses.find((s) => s.nome === oportunidade?.status)

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
                  {statuses.map((s) => (
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
          {oportunidade.empresaNome || oportunidade.clienteNome ? (
            <p className="text-sm text-slate-500">{oportunidade.empresaNome || oportunidade.clienteNome}</p>
          ) : null}
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
            <Field label="Pessoa / Cliente" value={oportunidade.empresaNome || oportunidade.clienteNome || "—"} />
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Propostas da Oportunidade
            <span className="ml-2 text-xs text-slate-400">({(oportunidade.propostas || []).length})</span>
          </h2>
          <Link
            href={`/comercial/crm/propostas/novo?oportunidadeId=${oportunidade.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={14} />
            Nova Proposta
          </Link>
        </div>

        {(oportunidade.propostas || []).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            Nenhuma proposta vinculada a esta oportunidade.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Proposta</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {oportunidade.propostas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/comercial/crm/propostas/${p.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {p.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">{formatarMoedaProposta(p.valor)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${PROPOSTA_STATUS[p.status]?.cor || ""}`}>
                        {PROPOSTA_STATUS[p.status]?.label || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-500">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Receipt size={16} className="text-emerald-600" />
              Faturamentos
              <span className="text-xs text-slate-400">({(oportunidade.faturamentos || []).length})</span>
            </h2>
            <Link
              href={`/comercial/crm/faturamentos/novo?oportunidadeId=${oportunidade.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={14} />
              Novo Faturamento
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">Total:</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatarValorTotal((oportunidade.faturamentos || []) as DocumentoVendaResumo[])}
            </span>
          </div>
          {(oportunidade.faturamentos || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum faturamento registrado.</p>
          ) : (
            <div className="space-y-2">
              {(oportunidade.faturamentos || []).slice(0, 5).map((f) => (
                <Link
                  key={f.id}
                  href={`/comercial/crm/faturamentos/${f.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                      {f.numero || `Faturamento #${f.id}`}
                    </span>
                    <span className={`inline-flex w-fit text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_FATURAMENTO_CORES[f.status] || ""}`}>
                      {STATUS_FATURAMENTO_LABELS[f.status] || f.status}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {formatarMoedaProposta(String(f.total ?? 0))}
                  </span>
                </Link>
              ))}
              {(oportunidade.faturamentos || []).length > 5 && (
                <Link href="/comercial/crm/faturamentos" className="block text-xs text-blue-600 hover:underline pt-1">
                  Ver todos os faturamentos
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <ShoppingCart size={16} className="text-emerald-600" />
              Pedidos de Venda
              <span className="text-xs text-slate-400">({(oportunidade.pedidosVenda || []).length})</span>
            </h2>
            <Link
              href={`/comercial/crm/pedidos-venda/novo?oportunidadeId=${oportunidade.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={14} />
              Novo Pedido
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">Total:</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatarValorTotal((oportunidade.pedidosVenda || []) as DocumentoVendaResumo[])}
            </span>
          </div>
          {(oportunidade.pedidosVenda || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum pedido de venda registrado.</p>
          ) : (
            <div className="space-y-2">
              {(oportunidade.pedidosVenda || []).slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/comercial/crm/pedidos-venda/${p.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                      {p.numero || `Pedido #${p.id}`}
                    </span>
                    <span className={`inline-flex w-fit text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_PEDIDO_VENDA_CORES[p.status] || ""}`}>
                      {STATUS_PEDIDO_VENDA_LABELS[p.status] || p.status}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {formatarMoedaProposta(String(p.total ?? 0))}
                  </span>
                </Link>
              ))}
              {(oportunidade.pedidosVenda || []).length > 5 && (
                <Link href="/comercial/crm/pedidos-venda" className="block text-xs text-blue-600 hover:underline pt-1">
                  Ver todos os pedidos de venda
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

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
