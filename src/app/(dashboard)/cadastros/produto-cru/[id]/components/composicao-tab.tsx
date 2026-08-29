"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import type { BaseUrdume, Composicao, Estrutura, Fio } from "./types"

const TIPO_ESTRUTURA = ["TRAMA", "URDUME"]

interface Props {
  isEditing: boolean
  composicao: Composicao[]
  totalPercentual: number
  percentualValido: boolean
  novoMaterial: string
  setNovoMaterial: (v: string) => void
  novoPercentual: string
  setNovoPercentual: (v: string) => void
  onAddComposicao: () => void
  onExcluirComposicao: (c: Composicao) => void
  estrutura: Estrutura[]
  fios: Fio[]
  fioLabel: (f: Fio) => string
  basesUrdume: BaseUrdume[]
  baseLabel: (b: BaseUrdume) => string
  novaEstruturaTipo: string
  setNovaEstruturaTipo: (v: string) => void
  novaEstruturaFioId: string
  setNovaEstruturaFioId: (v: string) => void
  novaEstruturaBaseUrdumeId: string
  setNovaEstruturaBaseUrdumeId: (v: string) => void
  novaEstruturaOrdem: string
  setNovaEstruturaOrdem: (v: string) => void
  onAddEstrutura: () => void
  onExcluirEstrutura: (e: Estrutura) => void
}

export function ComposicaoTab({
  isEditing,
  composicao,
  totalPercentual,
  percentualValido,
  novoMaterial,
  setNovoMaterial,
  novoPercentual,
  setNovoPercentual,
  onAddComposicao,
  onExcluirComposicao,
  estrutura,
  fios,
  fioLabel,
  basesUrdume,
  baseLabel,
  novaEstruturaTipo,
  setNovaEstruturaTipo,
  novaEstruturaFioId,
  setNovaEstruturaFioId,
  novaEstruturaBaseUrdumeId,
  setNovaEstruturaBaseUrdumeId,
  novaEstruturaOrdem,
  setNovaEstruturaOrdem,
  onAddEstrutura,
  onExcluirEstrutura,
}: Props) {
  if (!isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-slate-500">
        Salve o produto primeiro para configurar composição e estrutura.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Composição</h2>

        {composicao.length > 0 && (
          <div className="space-y-2">
            {composicao.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span>{c.material} — {c.percentual}%</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => onExcluirComposicao(c)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <p className={`text-sm ${percentualValido ? "text-green-600" : "text-red-500"}`}>
              Total: {totalPercentual.toFixed(2)}% {!percentualValido && "(deve ser 100%)"}
            </p>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="space-y-1 flex-1">
            <Label>Material</Label>
            <Input value={novoMaterial} onChange={e => setNovoMaterial(e.target.value)} placeholder="Algodão" />
          </div>
          <div className="space-y-1 w-24">
            <Label>%</Label>
            <Input value={novoPercentual} onChange={e => setNovoPercentual(e.target.value)} placeholder="63" />
          </div>
          <Button type="button" onClick={onAddComposicao} size="sm"><Plus size={16} /></Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Estrutura</h2>

        {estrutura.length > 0 && (
          <div className="space-y-2">
            {estrutura.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span>
                  {e.tipo} — {e.tipo === "TRAMA"
                  ? (fios.find((f) => f.id === e.fioId) ? fioLabel(fios.find((f) => f.id === e.fioId)!) : `Fio #${e.fioId || "—"}`)
                  : (basesUrdume.find((b) => b.id === e.baseUrdumeId) ? baseLabel(basesUrdume.find((b) => b.id === e.baseUrdumeId)!) : `Base Urdume #${e.baseUrdumeId || "—"}`)
                  }
                  {e.ordem ? ` (Ordem: ${e.ordem})` : ""}
                </span>
                <Button type="button" variant="ghost" size="icon" onClick={() => onExcluirEstrutura(e)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <select value={novaEstruturaTipo} onChange={e => setNovaEstruturaTipo(e.target.value)}
              className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
              {TIPO_ESTRUTURA.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {novaEstruturaTipo === "TRAMA" ? (
            <div className="space-y-1">
              <Label>Fio</Label>
              <select value={novaEstruturaFioId} onChange={e => setNovaEstruturaFioId(e.target.value)}
                className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                <option value="">Selecione</option>
                {fios.map((f) => <option key={f.id} value={f.id}>{fioLabel(f)}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Base Urdume</Label>
              <select value={novaEstruturaBaseUrdumeId} onChange={e => setNovaEstruturaBaseUrdumeId(e.target.value)}
                className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                <option value="">Selecione</option>
                {basesUrdume.map((b) => <option key={b.id} value={b.id}>{baseLabel(b)}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1 w-20">
            <Label>Ordem</Label>
            <Input value={novaEstruturaOrdem} onChange={e => setNovaEstruturaOrdem(e.target.value)} placeholder="1" />
          </div>
          <Button type="button" onClick={onAddEstrutura} size="sm"><Plus size={16} /></Button>
        </div>
      </div>
    </div>
  )
}
