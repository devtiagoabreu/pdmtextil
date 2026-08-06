import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import type { BancoDados } from "./types"

interface RedundDialogProps {
  open: boolean
  primario: BancoDados | null
  standbyId: string
  setStandbyId: (v: string) => void
  primaryDb: string
  setPrimaryDb: (v: string) => void
  standbyDb: string
  setStandbyDb: (v: string) => void
  lista: BancoDados[]
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function RedundDialog({
  open,
  primario,
  standbyId,
  setStandbyId,
  primaryDb,
  setPrimaryDb,
  standbyDb,
  setStandbyDb,
  lista,
  loading,
  onConfirm,
  onClose,
}: RedundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redundância de Dados</DialogTitle>
          <DialogDescription>
            Configura replicação lógica entre dois bancos (publicação + inscrição).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Servidor primário</Label>
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{primario?.nome}</p>
          </div>
          <div className="space-y-2">
            <Label>Banco primário</Label>
            <Input value={primaryDb} onChange={e => setPrimaryDb(e.target.value)} placeholder="Ex: producao" />
          </div>
          <div className="space-y-2">
            <Label>Servidor standby</Label>
            <select
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={standbyId}
              onChange={e => setStandbyId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {lista.filter((c: any) => c.id !== primario?.id).map((c: any) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Banco standby</Label>
            <Input value={standbyDb} onChange={e => setStandbyDb(e.target.value)} placeholder="Ex: producao_standby" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={loading || !primaryDb || !standbyDb || !standbyId} className="gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Configurar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
