import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import type { BancoDados } from "./types"

interface CloneDialogProps {
  open: boolean
  origem: BancoDados | null
  destinoId: string
  setDestinoId: (v: string) => void
  sourceDb: string
  setSourceDb: (v: string) => void
  targetDb: string
  setTargetDb: (v: string) => void
  lista: BancoDados[]
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function CloneDialog({
  open,
  origem,
  destinoId,
  setDestinoId,
  sourceDb,
  setSourceDb,
  targetDb,
  setTargetDb,
  lista,
  loading,
  onConfirm,
  onClose,
}: CloneDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clonar Banco de Dados</DialogTitle>
          <DialogDescription>
            Clona um banco de dados existente para outro banco.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Conexão de origem</Label>
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{origem?.nome}</p>
          </div>
          <div className="space-y-2">
            <Label>Banco de origem</Label>
            <Input value={sourceDb} onChange={e => setSourceDb(e.target.value)} placeholder="Ex: producao_principal" />
          </div>
          <div className="space-y-2">
            <Label>Conexão de destino</Label>
            <select
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={destinoId}
              onChange={e => setDestinoId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {lista.filter((c: any) => c.id !== origem?.id).map((c: any) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Novo banco (destino)</Label>
            <Input value={targetDb} onChange={e => setTargetDb(e.target.value)} placeholder="Ex: producao_backup" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={loading || !sourceDb || !targetDb || !destinoId} className="gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Clonar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
