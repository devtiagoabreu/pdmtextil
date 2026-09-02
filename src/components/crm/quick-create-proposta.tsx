"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog"

type Props = {
  empresaId?: string
  clienteId?: string
  oportunidadeId?: string
  onCreated: (id: number, titulo: string) => void
}

export function QuickCreateProposta({
  empresaId,
  clienteId,
  oportunidadeId,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [valor, setValor] = useState("")
  const [prazoEntrega, setPrazoEntrega] = useState("")
  const [descricao, setDescricao] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!titulo.trim()) {
      toast.error("Título é obrigatório")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/propostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          empresaId: empresaId ? parseInt(empresaId) : null,
          clienteId: clienteId ? parseInt(clienteId) : null,
          oportunidadeId: oportunidadeId ? parseInt(oportunidadeId) : null,
          valor: valor ? parseFloat(valor) : null,
          prazoEntrega: prazoEntrega || null,
          descricao: descricao || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar proposta")
      }
      const data = await res.json()
      onCreated(data.id, data.titulo)
      setOpen(false)
      setTitulo("")
      setValor("")
      setPrazoEntrega("")
      setDescricao("")
      toast.success("Proposta criada com sucesso")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors"
        title="Cadastrar nova proposta"
      >
        <Plus size={14} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Proposta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Proposta Comercial - Tecido X"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prazo de Entrega</label>
              <input
                type="text"
                value={prazoEntrega}
                onChange={e => setPrazoEntrega(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 30 dias"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes da proposta..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose
              type="button"
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </DialogClose>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
