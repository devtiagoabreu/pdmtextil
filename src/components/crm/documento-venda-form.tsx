"use client"

import { FileText, Plus, Trash2, Package } from "lucide-react"
import type { ItemVendaLinha } from "@/lib/crm/documento-venda"
import { UNIDADES_MEDIDA, UNIDADE_OUTRA, LABEL_UNIDADES, calcularValorTotal, somarValoresTotais } from "@/lib/crm/documento-venda"

interface DocumentoVendaFormProps {
  form: any
  setField: (field: string, value: any) => void
  itens: ItemVendaLinha[]
  setItens: (list: ItemVendaLinha[]) => void
  oportunidades: { id: number; titulo: string }[]
  statusOptions: { value: string; label: string }[]
  titulo: string
  plural: string
}

export function DocumentoVendaForm({ form, setField, itens, setItens, oportunidades, statusOptions, titulo, plural }: DocumentoVendaFormProps) {
  function updateItem(index: number, campo: keyof ItemVendaLinha, valor: string) {
    const novos = itens.map((item, i) => {
      if (i !== index) return item
      const atualizado = { ...item, [campo]: valor }
      if (campo === "quantidade" || campo === "valorUnitario") {
        atualizado.valorTotal = calcularValorTotal(atualizado.quantidade, atualizado.valorUnitario)
      }
      return atualizado
    })
    setItens(novos)
  }

  function addItem() {
    setItens([...itens, { produto: "", codigo: "", unidade: "METROS", unidadeOutra: "", quantidade: "", valorUnitario: "", valorTotal: "" }])
  }

  function removeItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  const total = somarValoresTotais(itens.map(i => ({ valorTotal: i.valorTotal })))

  return (
    <>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{titulo}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Oportunidade *
            </label>
            <select
              value={form.oportunidadeId || ""}
              onChange={e => setField("oportunidadeId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a oportunidade...</option>
              {oportunidades.map(o => (
                <option key={o.id} value={o.id}>{o.titulo}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
              <input
                type="text"
                value={form.numero || ""}
                onChange={e => setField("numero", e.target.value)}
                placeholder="Ex: NF-00123"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de emissão</label>
              <input
                type="date"
                value={form.dataEmissao || ""}
                onChange={e => setField("dataEmissao", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={form.status || statusOptions[0]?.value}
                onChange={e => setField("status", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origem</label>
              <select
                value={form.origem || "MANUAL"}
                onChange={e => setField("origem", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MANUAL">Manual</option>
                <option value="ERP">ERP (importado)</option>
              </select>
            </div>
          </div>
          {form.origem === "ERP" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referência externa</label>
              <input
                type="text"
                value={form.referenciaExterna || ""}
                onChange={e => setField("referenciaExterna", e.target.value)}
                placeholder="Código do documento no ERP"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação</label>
            <textarea
              value={form.observacao || ""}
              onChange={e => setField("observacao", e.target.value)}
              rows={3}
              placeholder="Informações adicionais..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Itens do {plural}</h2>
          </div>
          <div className="flex items-center gap-3">
            {itens.length > 0 && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/40 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>
        </div>

        {itens.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
            Nenhum item registrado. Clique em &quot;Adicionar&quot; para incluir produtos, quantidades e valores.
          </p>
        ) : (
          <div className="space-y-3">
            {itens.map((item, index) => (
              <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Produto *</label>
                    <input
                      type="text"
                      value={item.produto}
                      onChange={e => updateItem(index, "produto", e.target.value)}
                      placeholder="Ex: Tecido 100% algodão"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Código</label>
                    <input
                      type="text"
                      value={item.codigo}
                      onChange={e => updateItem(index, "codigo", e.target.value)}
                      placeholder="Opcional"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Unidade</label>
                    <select
                      value={item.unidade}
                      onChange={e => updateItem(index, "unidade", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...UNIDADES_MEDIDA, UNIDADE_OUTRA].map(u => (
                        <option key={u} value={u}>{LABEL_UNIDADES[u]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Unidade (outra)</label>
                    <input
                      type="text"
                      value={item.unidadeOutra}
                      onChange={e => updateItem(index, "unidadeOutra", e.target.value)}
                      placeholder={item.unidade === UNIDADE_OUTRA ? "Ex: Rolo, Caixa..." : "Somente se unidade = Outra"}
                      disabled={item.unidade !== UNIDADE_OUTRA}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.quantidade}
                      onChange={e => updateItem(index, "quantidade", e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Valor unit. (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.valorUnitario}
                      onChange={e => updateItem(index, "valorUnitario", e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Valor total</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.valorTotal}
                      onChange={e => updateItem(index, "valorTotal", e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-1 flex justify-end sm:justify-center">
                    <div className="flex flex-col justify-end">
                      <label className="block text-xs font-medium text-slate-500 mb-1 invisible">&nbsp;</label>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                        title={`Remover item do ${plural}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}