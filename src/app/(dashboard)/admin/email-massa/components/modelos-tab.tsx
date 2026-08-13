"use client"

import { Button } from "@/components/ui/button"
import { Plus, Copy, Pencil, Eye, Trash2 } from "lucide-react"
import type { Modelo } from "../types"

export interface ModelosTabProps {
  modelos: Modelo[]
  onNovo: () => void
  onUsar: (m: Modelo) => void
  onEditar: (m: Modelo) => void
  onVer: (m: Modelo) => void
  onDeletar: (m: Modelo) => void
}

export function ModelosTab({ modelos, onNovo, onUsar, onEditar, onVer, onDeletar }: ModelosTabProps) {
  return (
    <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Modelos de Email</h2>
          <Button onClick={onNovo} className="gap-1"><Plus size={14} /> Novo Modelo</Button>
        </div>

        {modelos.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Nenhum modelo cadastrado. Clique em &ldquo;Novo Modelo&rdquo; para criar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left font-medium p-2">Nome</th>
                  <th className="text-left font-medium p-2">Assunto</th>
                  <th className="text-right font-medium p-2 w-52">Ações</th>
                </tr>
              </thead>
              <tbody>
                {modelos.map((m: any) => (
                  <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2 font-medium">{m.nome}</td>
                    <td className="p-2 text-slate-500 truncate max-w-xs">{m.assunto}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="xs" onClick={() => onUsar(m)} className="gap-1">
                          <Copy size={12} /> Usar
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => onEditar(m)} aria-label={`Editar modelo ${m.nome}`} className="gap-1">
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => onVer(m)} aria-label={`Ver modelo ${m.nome}`} className="gap-1">
                          <Eye size={12} />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => onDeletar(m)} aria-label={`Deletar modelo ${m.nome}`} className="gap-1 text-red-500 hover:text-red-700">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelosTab
