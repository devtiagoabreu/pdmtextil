"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Link as LinkIcon, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { QuickCreateCliente } from "./quick-create-cliente"
import { QuickCreatePessoa } from "./quick-create-pessoa"

type Props = {
  visitaId: number
  open: boolean
  onClose: () => void
  onLinked: () => void
}

export default function VincularVisitaModal({ visitaId, open, onClose, onLinked }: Props) {
  const [tipo, setTipo] = useState<"CLIENTE" | "PESSOA" | "">("")
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [createOpenPessoa, setCreateOpenPessoa] = useState(false)

  useEffect(() => {
    if (!open) {
      setTipo("")
      setSelectedId("")
      setCreateOpen(false)
      setCreateOpenPessoa(false)
      return
    }
  }, [open])

  const { data: lista, isLoading: loadingList, isError } = useQuery<any[]>({
    queryKey: ["vincular-lista", tipo],
    queryFn: async () => {
      const url = tipo === "CLIENTE" ? "/api/clientes" : "/api/crm/pessoas"
      const res = await fetch(url)
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    enabled: !!tipo,
  })

  useEffect(() => {
    if (tipo) setSelectedId("")
  }, [tipo])

  useEffect(() => {
    if (isError) toast.error("Erro ao carregar lista")
  }, [isError])

  const clientes = tipo === "CLIENTE" ? (lista ?? []) : []
  const empresas = tipo === "PESSOA" ? (lista ?? []) : []

  async function linkVisita(body: Record<string, any>, successMsg: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/crm/visitas/${visitaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao vincular")
      }
      toast.success(successMsg)
      onLinked()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!selectedId) {
      toast.error(`Selecione um${tipo === "CLIENTE" ? " cliente" : "a pessoa"}`)
      return
    }
    const body: Record<string, any> = { nomeAvulso: null }
    if (tipo === "CLIENTE") {
      body.clienteId = parseInt(selectedId)
      body.empresaId = null
    } else {
      body.empresaId = parseInt(selectedId)
      body.clienteId = null
    }
    await linkVisita(body, "Visita vinculada com sucesso!")
  }

  async function handleClienteCreated(id: number, nome: string) {
    await linkVisita(
      { clienteId: id, empresaId: null, nomeAvulso: null },
      `Cliente "${nome}" criado e vinculado à visita!`,
    )
  }

  async function handlePessoaCreated(id: number, razaoSocial: string) {
    await linkVisita(
      { empresaId: id, clienteId: null, nomeAvulso: null },
      `Pessoa "${razaoSocial}" criada e vinculada à visita!`,
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon size={18} className="text-orange-500" />
            Vincular Visita Avulsa
          </DialogTitle>
        </DialogHeader>

        {!tipo ? (
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTipo("CLIENTE")}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
            >
              <span className="text-sm font-semibold text-emerald-600">Cliente</span>
              <span className="text-xs text-slate-500 text-center">Vincular a um cliente existente</span>
            </button>
            <button
              type="button"
              onClick={() => setTipo("PESSOA")}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
            >
              <span className="text-sm font-semibold text-blue-600">Pessoa</span>
              <span className="text-xs text-slate-500 text-center">Vincular a uma pessoa (negócio)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {tipo === "CLIENTE" ? "Selecione o Cliente" : "Selecione a Pessoa"}
              </span>
              <button
                type="button"
                onClick={() => { setTipo(""); setSelectedId("") }}
                className="text-xs text-slate-500 hover:underline"
              >
                Trocar
              </button>
            </div>

            {loadingList ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {(tipo === "CLIENTE" ? clientes : empresas).map((item: any) => (
                  <option key={item.id} value={String(item.id)}>
                    {tipo === "CLIENTE" ? item.nome : (item.razaoSocial || item.nomeFantasia)}
                  </option>
                ))}
              </select>
            )}

            {tipo === "CLIENTE" && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400">ou crie um novo</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                >
                  <Plus size={14} />
                  Criar novo cliente
                </button>
                <QuickCreateCliente
                  open={createOpen}
                  onOpenChange={setCreateOpen}
                  onCreated={handleClienteCreated}
                />
              </div>
            )}

            {tipo === "PESSOA" && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400">ou crie um novo</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpenPessoa(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <Plus size={14} />
                  Criar nova pessoa
                </button>
                <QuickCreatePessoa
                  open={createOpenPessoa}
                  onOpenChange={setCreateOpenPessoa}
                  onCreated={handlePessoaCreated}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || !selectedId}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                {loading ? "Vinculando..." : "Vincular"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
