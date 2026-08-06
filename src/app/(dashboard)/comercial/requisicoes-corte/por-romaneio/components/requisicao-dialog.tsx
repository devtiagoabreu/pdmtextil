import { Loader2, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { GrupoRomaneio, ItemCorteDialog } from "./types"
import { formatarMetragem } from "./utils"

interface RequisicaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  romaneio: GrupoRomaneio | null
  itens: ItemCorteDialog[]
  onAtualizarMetragem: (index: number, valor: string) => void
  onConfirmar: () => void
  criando: boolean
}

export function RequisicaoDialog({
  open,
  onOpenChange,
  romaneio,
  itens,
  onAtualizarMetragem,
  onConfirmar,
  criando,
}: RequisicaoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Requisição de Corte</DialogTitle>
          <DialogDescription>
            Romaneio Nº {romaneio?.romaneio} — Informe a metragem desejada para cada produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {itens.map((item: any, index: any) => (
            <div
              key={item.produto}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                    {item.produto}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Disponível: {formatarMetragem(item.metragemDisponivel)}
                    {item.cor && ` — Cor: ${item.cor}`}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-slate-500">Metragem para corte</Label>
                <Input
                  value={item.metragem}
                  onChange={(e) => onAtualizarMetragem(index, e.target.value)}
                  placeholder="Ex: 50"
                  className="h-9 text-sm mt-0.5"
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={criando} className="gap-2">
            {criando && <Loader2 size={16} className="animate-spin" />}
            <Scissors size={16} />
            Criar Requisição de Corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
