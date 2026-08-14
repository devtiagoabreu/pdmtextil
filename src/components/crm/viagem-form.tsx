"use client"

import { Plane, Wallet, Plus, Trash2 } from "lucide-react"
import { SelectUf } from "@/components/crm/select-uf"
import type { InvestimentoLinha } from "@/lib/crm/viagem"

export const INVESTIMENTO_TIPOS = [
  { value: "PASSAGEM", label: "Passagem" },
  { value: "HOSPEDAGEM", label: "Hospedagem" },
  { value: "ALIMENTACAO", label: "Alimentação" },
  { value: "VEICULO", label: "Veículo / Aluguel" },
  { value: "OUTROS", label: "Outros" },
]

export const VIAGEM_STATUS_OPTIONS = [
  { value: "PLANEJADA", label: "Planejada" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
]

interface ViagemFormProps {
  form: any
  setField: (field: string, value: any) => void
  investimentos: InvestimentoLinha[]
  setInvestimentos: (list: InvestimentoLinha[]) => void
}

export function ViagemForm({ form, setField, investimentos, setInvestimentos }: ViagemFormProps) {
  function updateInvestimento(index: number, campo: keyof InvestimentoLinha, valor: string) {
    setInvestimentos(investimentos.map((inv, i) => (i === index ? { ...inv, [campo]: valor } : inv)))
  }

  function addInvestimento() {
    setInvestimentos([...investimentos, { tipo: "PASSAGEM", valor: "", observacao: "" }])
  }

  function removeInvestimento(index: number) {
    setInvestimentos(investimentos.filter((_, i) => i !== index))
  }

  const total = investimentos.reduce((acc, inv) => acc + (parseFloat(inv.valor) || 0), 0)

  return (
    <>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plane size={18} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Dados da Viagem</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={form.titulo || ""}
              onChange={e => setField("titulo", e.target.value)}
              placeholder="Ex: Feira Agritech - São Paulo"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição / Observações</label>
            <textarea
              value={form.descricao || ""}
              onChange={e => setField("descricao", e.target.value)}
              rows={3}
              placeholder="Objetivo da viagem, agenda prevista, detalhes..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade de destino</label>
              <input
                type="text"
                value={form.destinoCidade || ""}
                onChange={e => setField("destinoCidade", e.target.value)}
                placeholder="Cidade"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
              <SelectUf value={form.destinoUf || ""} onChange={v => setField("destinoUf", v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de início</label>
              <input
                type="date"
                value={form.dataInicio || ""}
                onChange={e => setField("dataInicio", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de fim</label>
              <input
                type="date"
                value={form.dataFim || ""}
                onChange={e => setField("dataFim", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={form.status || "PLANEJADA"}
              onChange={e => setField("status", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VIAGEM_STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Investimentos</h2>
          </div>
          <div className="flex items-center gap-3">
            {investimentos.length > 0 && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <button
              type="button"
              onClick={addInvestimento}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/40 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>
        </div>

        {investimentos.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
            Nenhum investimento registrado. Clique em "Adicionar" para incluir passagens, hospedagem, alimentação, etc.
          </p>
        ) : (
          <div className="space-y-3">
            {investimentos.map((inv, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                  <select
                    value={inv.tipo}
                    onChange={e => updateInvestimento(index, "tipo", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INVESTIMENTO_TIPOS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inv.valor}
                    onChange={e => updateInvestimento(index, "valor", e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Observação</label>
                  <input
                    type="text"
                    value={inv.observacao}
                    onChange={e => updateInvestimento(index, "observacao", e.target.value)}
                    placeholder="Ex: Voo ida e volta - Latam"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-6 sm:col-span-1 flex justify-end sm:justify-center">
                  <button
                    type="button"
                    onClick={() => removeInvestimento(index)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    title="Remover investimento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
