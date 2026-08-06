import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NovaConexaoFormProps {
  nome: string
  setNome: (v: string) => void
  connectionString: string
  setConnectionString: (v: string) => void
  saving: boolean
  onAdd: () => void
  onCancel: () => void
}

export function NovaConexaoForm({
  nome,
  setNome,
  connectionString,
  setConnectionString,
  saving,
  onAdd,
  onCancel,
}: NovaConexaoFormProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Nova Conexão</h2>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Produção Neon" />
      </div>
      <div className="space-y-2">
        <Label>String de Conexão</Label>
        <Input value={connectionString} onChange={e => setConnectionString(e.target.value)} placeholder="postgresql://user:pass@host:5432/postgres" />
      </div>
      <div className="flex gap-2">
        <Button onClick={onAdd} disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Adicionar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
