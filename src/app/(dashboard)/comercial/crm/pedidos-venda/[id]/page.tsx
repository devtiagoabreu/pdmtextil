"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingCart, Loader2, Building2, Calendar } from "lucide-react"
import { toast } from "sonner"
import { DocumentoVendaForm } from "@/components/crm/documento-venda-form"
import {
  statusOptions,
  STATUS_PEDIDO_VENDA,
  STATUS_PEDIDO_VENDA_LABELS,
  STATUS_PEDIDO_VENDA_CORES,
  itemLinhaParaForm,
  somarValoresTotais,
  LABEL_UNIDADES,
} from "@/lib/crm/documento-venda"
import type { ItemVendaLinha } from "@/lib/crm/documento-venda"
import type { PedidoVenda, PedidoVendaForm as PedidoVendaFormType } from "../types"

export default function PedidoVendaDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const [pedido, setPedido] = useState<PedidoVenda | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<PedidoVendaFormType>>({})
  const [itens, setItens] = useState<ItemVendaLinha[]>([])
  const [oportunidades, setOportunidades] = useState<{ id: number; titulo: string }[]>([])
  const [saving, setSaving] = useState(false)

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    fetch(`/api/crm/pedidos-venda/${params.id}`)
      .then((r) => r.json() as Promise<PedidoVenda>)
      .then((data: PedidoVenda) => {
        setPedido(data)
        setForm({
          oportunidadeId: String(data.oportunidadeId || ""),
          numero: data.numero || "",
          dataEmissao: data.dataEmissao || "",
          status: data.status || "ABERTO",
          observacao: data.observacao || "",
          origem: data.origem || "MANUAL",
          referenciaExterna: data.referenciaExterna || "",
        })
        setItens((data.itens || []).map(itemLinhaParaForm))
      })
      .catch(() => toast.error("Erro ao carregar pedido de venda"))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    fetch("/api/crm/oportunidades")
      .then((r) => r.json())
      .then((data) => setOportunidades(Array.isArray(data) ? data.map((o: any) => ({ id: Number(o.id), titulo: o.titulo })) : []))
      .catch(() => setOportunidades([]))
  }, [])

  function startEditing() {
    if (!pedido) return
    setForm({
      oportunidadeId: String(pedido.oportunidadeId || ""),
      numero: pedido.numero || "",
      dataEmissao: pedido.dataEmissao || "",
      status: pedido.status || "ABERTO",
      observacao: pedido.observacao || "",
      origem: pedido.origem || "MANUAL",
      referenciaExterna: pedido.referenciaExterna || "",
    })
    setItens((pedido.itens || []).map(itemLinhaParaForm))
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/pedidos-venda/${params.id}`, {
        method: "PUT",
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
        throw new Error(err.error || "Erro ao atualizar pedido de venda")
      }
      const updated = await res.json()
      setPedido({ ...pedido, ...updated, itens })
      setEditing(false)
      toast.success("Pedido de venda atualizado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar pedido de venda")
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

  if (!pedido) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Pedido de venda não encontrado</p>
        <Link href="/comercial/crm/pedidos-venda" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  const total = somarValoresTotais(pedido.itens || [])
  const statusLabel = STATUS_PEDIDO_VENDA_LABELS[pedido.status] || pedido.status
  const statusColor = STATUS_PEDIDO_VENDA_CORES[pedido.status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" />
            {pedido.numero || `Pedido #${pedido.id}`}{info && <InfoButton content={info} />}
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
            {pedido.oportunidadeTitulo && (
              <span className="flex items-center gap-1">
                <Building2 size={13} />
                {pedido.oportunidadeTitulo}
              </span>
            )}
            {pedido.dataEmissao && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(pedido.dataEmissao + "T12:00:00").toLocaleDateString("pt-BR")}
              </span>
            )}
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              {statusLabel}
            </span>
            {pedido.origem === "ERP" && (
              <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                ERP{pedido.referenciaExterna ? ` · ${pedido.referenciaExterna}` : ""}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => (editing ? setEditing(false) : startEditing())}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">
          <ShoppingCart size={16} className="text-emerald-600" />
          Valor Total
        </div>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>

      {pedido.observacao && !editing && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Observação</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{pedido.observacao}</p>
        </div>
      )}

      {editing ? (
        <div className="space-y-4">
          <DocumentoVendaForm
            form={form}
            setField={setField}
            itens={itens}
            setItens={setItens}
            oportunidades={oportunidades}
            statusOptions={statusOptions(STATUS_PEDIDO_VENDA, STATUS_PEDIDO_VENDA_LABELS)}
            titulo="Dados do Pedido de Venda"
            plural="pedido"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Itens</h2>
          {pedido.itens.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Nenhum item registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Produto</th>
                    <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden sm:table-cell">Un.</th>
                    <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Qtd</th>
                    <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pedido.itens.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5 text-sm">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{item.produto}</p>
                        {item.codigo && (
                          <p className="text-xs text-slate-400">{item.codigo}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {item.unidade === "OUTRA" ? item.unidadeOutra : LABEL_UNIDADES[item.unidade] || item.unidade}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        {item.quantidade != null ? Number(item.quantidade).toLocaleString("pt-BR") : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {Number(item.valorTotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}