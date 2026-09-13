"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InfoButton } from "@/components/ui/info-button"
import type { InfoContent } from "@/lib/info-content"

export interface CampoLista {
  campo: string
  label: string
  placeholder?: string
  className?: string
}

interface ListaEditorProps<T> {
  titulo: string
  baseId: string
  campos: CampoLista[]
  itens: T[]
  onChange: (itens: T[]) => void
  criarItem: () => T
  rotuloAdicionar: string
  info?: InfoContent
  dica?: string
  vazioTexto?: string
}

export function ListaEditor<T extends Record<string, string>>({
  titulo,
  baseId,
  campos,
  itens,
  onChange,
  criarItem,
  rotuloAdicionar,
  info,
  dica,
  vazioTexto,
}: ListaEditorProps<T>) {
  function atualizar(indice: number, campo: string, valor: string) {
    onChange(itens.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  function remover(indice: number) {
    onChange(itens.filter((_, i) => i !== indice))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{titulo}</Label>
        {info && <InfoButton content={info} />}
      </div>
      {dica && <p className="text-xs text-slate-500 dark:text-slate-400">{dica}</p>}

      {itens.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-500 dark:text-slate-400">
          {vazioTexto ?? "Nenhum item adicionado ainda."}
        </p>
      ) : (
        <div className="space-y-2">
          {itens.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Item {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => remover(i)}
                  aria-label={`Remover ${titulo} ${i + 1}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {campos.map((c) => (
                  <div key={c.campo} className={`space-y-1 ${c.className ?? ""}`}>
                    <Label htmlFor={`${baseId}-${i}-${c.campo}`} className="text-xs text-slate-600 dark:text-slate-300">
                      {c.label}
                    </Label>
                    <Input
                      id={`${baseId}-${i}-${c.campo}`}
                      value={item[c.campo] ?? ""}
                      placeholder={c.placeholder}
                      onChange={(e) => atualizar(i, c.campo, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onChange([...itens, criarItem()])}>
        <Plus size={14} />
        {rotuloAdicionar}
      </Button>
    </div>
  )
}