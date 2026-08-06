"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { FichaTecnica, ProdutoCru } from "./types"

interface Props {
  produto: ProdutoCru
  handleFichaTecnicaChange: (field: keyof FichaTecnica, value: string) => void
  saving: boolean
  isEditing: boolean
}

export function FichaTecnicaTab({ produto, handleFichaTecnicaChange, saving, isEditing }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">Ficha Técnica</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gramatura Linear (g/m)</Label>
            <Input value={produto.fichaTecnica?.gramaturaLinear || ""} onChange={e => handleFichaTecnicaChange("gramaturaLinear", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Largura (m)</Label>
            <Input value={produto.fichaTecnica?.largura || ""} onChange={e => handleFichaTecnicaChange("largura", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Gramatura (g/m²)</Label>
            <Input value={produto.fichaTecnica?.gramatura || ""} onChange={e => handleFichaTecnicaChange("gramatura", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Densidade (fios/cm)</Label>
            <Input value={produto.fichaTecnica?.densidade || ""} onChange={e => handleFichaTecnicaChange("densidade", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ligamento</Label>
            <Input value={produto.fichaTecnica?.ligamento || ""} onChange={e => handleFichaTecnicaChange("ligamento", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Passamento</Label>
            <Input value={produto.fichaTecnica?.passamento || ""} onChange={e => handleFichaTecnicaChange("passamento", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Batidas</Label>
            <Input value={produto.fichaTecnica?.batidas || ""} onChange={e => handleFichaTecnicaChange("batidas", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Qtde Fios Urdume</Label>
            <Input value={produto.fichaTecnica?.qtdeFiosUrdume || ""} onChange={e => handleFichaTecnicaChange("qtdeFiosUrdume", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Observações</Label>
          <Input value={produto.fichaTecnica?.observacoes || ""} onChange={e => handleFichaTecnicaChange("observacoes", e.target.value)} />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEditing ? "Atualizar" : "Salvar"}
        </Button>
        <Link href="/cadastros/produto-cru">
          <Button variant="outline" type="button">Cancelar</Button>
        </Link>
      </div>
    </div>
  )
}
