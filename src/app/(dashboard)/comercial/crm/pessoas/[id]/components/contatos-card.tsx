import { useState } from "react"
import { Plus, Unlink, Mail, UserPlus } from "lucide-react"

interface ContatosCardProps {
  contatos: any[]
  orfaos: any[]
  onAdd: () => void
  onVincular: (contatoId: number) => void
  onRemover: (contatoId: number) => void
}

export function ContatosCard({ contatos, orfaos, onAdd, onVincular, onRemover }: ContatosCardProps) {
  const [selecionado, setSelecionado] = useState("")

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Contatos</h2>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {orfaos.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
          <p className="text-xs font-medium text-slate-500">Vincular contato órfão</p>
          <div className="flex gap-2">
            <select
              aria-label="Contatos sem vínculo"
              value={selecionado}
              onChange={e => setSelecionado(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um contato...</option>
              {orfaos.map((o: any) => (
                <option key={o.id} value={String(o.id)}>
                  {o.nome}{o.email ? ` — ${o.email}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => { if (selecionado) { onVincular(parseInt(selecionado)); setSelecionado("") } }}
              disabled={!selecionado}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <UserPlus size={12} /> Vincular
            </button>
          </div>
        </div>
      )}

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
              <button
                onClick={() => onRemover(contato.id)}
                title="Desvincular contato"
                className="p-1 text-slate-400 hover:text-red-500"
              >
                <Unlink size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
