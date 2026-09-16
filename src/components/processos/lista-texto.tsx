"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InfoButton } from "@/components/ui/info-button"
import type { InfoContent } from "@/lib/info-content"

interface ListaTextoProps {
  titulo: string
  baseId: string
  itens: string[]
  onChange: (itens: string[]) => void
  rotuloAdicionar: string
  info?: InfoContent
  dica?: string
  vazioTexto?: string
  placeholderItem?: string
}

export function ListaTexto({
  titulo,
  baseId,
  itens,
  onChange,
  rotuloAdicionar,
  info,
  dica,
  vazioTexto,
  placeholderItem,
}: ListaTextoProps) {
  function atualizar(indice: number, valor: string) {
    onChange(itens.map((item, i) => (i === indice ? valor : item)))
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
            <div key={i} className="flex items-center gap-2">
              <Input
                id={`${baseId}-${i}`}
                aria-label={`${titulo} ${i + 1}`}
                value={item}
                placeholder={placeholderItem}
                onChange={(e) => atualizar(i, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600"
                onClick={() => remover(i)}
                aria-label={`Remover ${titulo} ${i + 1}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => onChange([...itens, ""])}
      >
        <Plus size={14} />
        {rotuloAdicionar}
      </Button>
    </div>
  )
}
