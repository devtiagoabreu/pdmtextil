"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog"

type Props = {
  empresaId?: string
  clienteId?: string
  clienteNome?: string
  onClickGuard?: () => boolean
  onCreated: (id: number, nome: string) => void
}

export function QuickCreateContato({ empresaId, clienteId, clienteNome, onClickGuard, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [nome, setNome] = useState("")
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(empresaId || "")
  const [cargo, setCargo] = useState("")
  const [email, setEmail] = useState("")
  const [celular, setCelular] = useState("")

  useEffect(() => {
    if (!open) return
    fetch("/api/crm/pessoas")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEmpresas(data) })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    if (empresaId) setSelectedEmpresaId(empresaId)
  }, [empresaId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!selectedEmpresaId && !clienteId) {
      toast.error("Selecione uma Pessoa ou tenha um Cliente vinculado")
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        nome,
        cargo: cargo || null,
        email: email || null,
        celular: celular || null,
      }
      if (selectedEmpresaId) payload.empresaId = parseInt(selectedEmpresaId)
      if (clienteId) payload.clienteId = parseInt(clienteId)

      const res = await fetch("/api/crm/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar contato")
      }
      const data = await res.json()
      onCreated(data.id, data.nome)
      setOpen(false)
      setNome("")
      setCargo("")
      setEmail("")
      setCelular("")
      toast.success("Contato criado com sucesso")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleOpen() {
    if (onClickGuard && !onClickGuard()) return
    setSelectedEmpresaId(empresaId || "")
    setOpen(true)
  }

  const isClienteMode = !empresaId && !!clienteId

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={handleOpen}
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
        title="Cadastrar novo contato"
      >
        <Plus size={14} />
      </button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        {isClienteMode && clienteNome && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <span className="font-medium">Cliente:</span> {clienteNome}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pessoa (Negócio) {isClienteMode ? "" : "*"}
            </label>
            <select
              value={selectedEmpresaId}
              onChange={e => setSelectedEmpresaId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!isClienteMode}
            >
              <option value="">Selecione...</option>
              {empresas.map((e: any) => (
                <option key={e.id} value={String(e.id)}>{e.razaoSocial || e.nomeFantasia}</option>
              ))}
            </select>
            {isClienteMode && (
              <p className="text-[11px] text-slate-400 mt-1">Opcional — vincule a uma Pessoa se desejar</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Celular</label>
              <input
                type="text"
                value={celular}
                onChange={e => setCelular(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
