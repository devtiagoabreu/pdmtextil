import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import type { BancoDados } from "./types"

interface CriarDialogProps {
  modal: BancoDados | null
  dbNome: string
  setDbNome: (v: string) => void
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function CriarDialog({ modal, dbNome, setDbNome, loading, onConfirm, onClose }: CriarDialogProps) {
  return (
    <Dialog open={!!modal} onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Banco de Dados</DialogTitle>
          <DialogDescription>
            Cria um novo banco vazio na conexão <strong>{modal?.nome}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Nome do banco</Label>
          <Input value={dbNome} onChange={e => setDbNome(e.target.value)} placeholder="Ex: novo_banco" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={loading || !dbNome} className="gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
