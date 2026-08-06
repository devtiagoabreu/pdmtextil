import { Plus, Trash2, Mail } from "lucide-react"

interface ContatosCardProps {
  contatos: any[]
  onAdd: () => void
  onRemove: (id: number) => void
}

export function ContatosCard({ contatos, onAdd, onRemove }: ContatosCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Contatos</h2>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
          <Plus size={14} /> Adicionar
        </button>
      </div>
      {contatos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Nenhum contato cadastrado</p>
      ) : (
        <div className="space-y-2">
          {contatos.map((contato: any) => (
            <div key={contato.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{contato.nome}</p>
                  {contato.principal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">Principal</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  {contato.cargo && <span>{contato.cargo}</span>}
                  {contato.email && <span className="flex items-center gap-1"><Mail size={10} />{contato.email}</span>}
                  {contato.telefone && <span>{contato.telefone}</span>}
                </div>
              </div>
              <button onClick={() => onRemove(contato.id)} className="p-1 text-slate-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
