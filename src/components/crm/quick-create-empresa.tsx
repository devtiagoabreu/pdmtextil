"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog"

type Props = {
  onCreated: (id: number, razaoSocial: string) => void
}

export function QuickCreateEmpresa({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [razaoSocial, setRazaoSocial] = useState("")
  const [nomeFantasia, setNomeFantasia] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [segmento, setSegmento] = useState("")
  const [porte, setPorte] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!razaoSocial.trim() || !cnpj.trim()) {
      toast.error("Razão Social e CNPJ são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razaoSocial,
          nomeFantasia: nomeFantasia || null,
          cnpj,
          segmento: segmento || null,
          porte: porte || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar empresa")
      }
      const data = await res.json()
      onCreated(data.id, data.razaoSocial)
      setOpen(false)
      setRazaoSocial("")
      setNomeFantasia("")
      setCnpj("")
      setSegmento("")
      setPorte("")
      toast.success("Empresa criada com sucesso")
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
        title="Cadastrar nova empresa"
      >
        <Plus size={14} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razão Social *</label>
            <input
              type="text"
              value={razaoSocial}
              onChange={e => setRazaoSocial(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia</label>
            <input
              type="text"
              value={nomeFantasia}
              onChange={e => setNomeFantasia(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ *</label>
            <input
              type="text"
              value={cnpj}
              onChange={e => setCnpj(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00.000.000/0001-00"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Segmento</label>
              <select
                value={segmento}
                onChange={e => setSegmento(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="CONFECCAO">Confecção</option>
                <option value="LAVANDERIA">Lavanderia</option>
                <option value="ESTAMPARIA">Estamparia</option>
                <option value="MALHARIA">Malharia</option>
                <option value="TINTURARIA">Tinturaria</option>
                <option value="ACABAMENTO">Acabamento</option>
                <option value="COMERCIO">Comércio</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Porte</label>
              <select
                value={porte}
                onChange={e => setPorte(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="ME">ME</option>
                <option value="EPP">EPP</option>
                <option value="MEDIO">Médio</option>
                <option value="GRANDE">Grande</option>
              </select>
            </div>
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
