import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface NovoMenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  setTitulo: (v: string) => void
  onCriar: () => void
}

export function NovoMenuDialog({
  open,
  onOpenChange,
  titulo,
  setTitulo,
  onCriar,
}: NovoMenuDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Menu</DialogTitle>
          <DialogDescription>
            Dê um nome para o novo menu de navegação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Nome do menu</Label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Comercial"
            onKeyDown={(e) => {
              if (e.key === "Enter" && titulo.trim()) onCriar()
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onCriar} disabled={!titulo.trim()} className="gap-2">
            <Plus size={14} />
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
