import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CopiarMenusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuarios: { id: number; name: string }[]
  selectedUsuarioId: number | null
  setSelectedUsuarioId: (id: number | null) => void
  copying: boolean
  onCopiar: () => void
}

export function CopiarMenusDialog({
  open,
  onOpenChange,
  usuarios,
  selectedUsuarioId,
  setSelectedUsuarioId,
  copying,
  onCopiar,
}: CopiarMenusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copiar menus de outro usuário</DialogTitle>
          <DialogDescription>
            Selecione um usuário para copiar todos os menus e itens. Os menus atuais serão substituídos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Usuário de origem</Label>
          <Select
            value={selectedUsuarioId?.toString() || ""}
            onValueChange={(v) => setSelectedUsuarioId(v ? parseInt(v) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um usuário..." />
            </SelectTrigger>
            <SelectContent>
              {usuarios.map((u: any) => (
                <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" disabled={copying} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onCopiar} disabled={!selectedUsuarioId || copying} className="gap-2">
            {copying ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
            Copiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
