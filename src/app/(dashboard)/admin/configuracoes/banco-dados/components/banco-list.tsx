import { Check, Database, Trash2, Circle, Copy, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BancoDados } from "./types"

interface BancoListProps {
  lista: BancoDados[]
  onCriar: (item: BancoDados) => void
  onClone: (item: BancoDados) => void
  onRedund: (item: BancoDados) => void
  onAtivar: (item: BancoDados) => void
  onDelete: (id: number) => void
}

export function BancoList({ lista, onCriar, onClone, onRedund, onAtivar, onDelete }: BancoListProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {lista.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">Nenhuma conexão cadastrada</p>
        ) : (
          lista.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.ativo ? (
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 flex-shrink-0">
                    <Check size={16} />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex-shrink-0">
                    <Database size={16} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{item.nome}</p>
                  <p className="text-xs text-slate-500 font-mono truncate max-w-md">{item.connectionString}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.ativo && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => onCriar(item)} className="gap-1" aria-label="Criar banco de dados">
                      <Circle size={14} /> Criar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onClone(item)} className="gap-1" aria-label="Clonar banco de dados">
                      <Copy size={14} /> Clonar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onRedund(item)} className="gap-1" aria-label="Configurar redundância">
                      <GitBranch size={14} /> Redund.
                    </Button>
                  </>
                )}
                {!item.ativo && (
                  <Button size="sm" variant="outline" onClick={() => onAtivar(item)} className="gap-1">
                    <Check size={14} /> Ativar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onDelete(item.id)} className="gap-1 text-red-600" aria-label="Remover conexão">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
