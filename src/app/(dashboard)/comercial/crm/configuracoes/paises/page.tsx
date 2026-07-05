"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useState } from "react"
import { Globe, PlusCircle, Pencil, Trash2, Loader2, Search, X, Check } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

type Pais = { id: number; nome: string; codigo: string; createdAt: string }

async function fetchPaises() {
  const res = await fetch("/api/crm/paises")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

export default function PaisesConfigPage() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [busca, setBusca] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formNome, setFormNome] = useState("")
  const [formCodigo, setFormCodigo] = useState("")

  const { data: paises, isLoading } = useQuery({
    queryKey: ["crm-paises"],
    queryFn: fetchPaises,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { nome: formNome, codigo: formCodigo }
      if (editId) {
        const res = await fetch(`/api/crm/paises/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Falha ao atualizar")
        return res.json()
      }
      const res = await fetch("/api/crm/paises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Falha ao criar")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-paises"] })
      resetForm()
      toast.success(editId ? "País atualizado" : "País cadastrado")
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/crm/paises/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-paises"] })
      toast.success("País excluído")
    },
    onError: (err: any) => toast.error(err.message),
  })

  function resetForm() {
    setShowForm(false)
    setEditId(null)
    setFormNome("")
    setFormCodigo("")
  }

  function startEdit(p: Pais) {
    setEditId(p.id)
    setFormNome(p.nome)
    setFormCodigo(p.codigo)
    setShowForm(true)
  }

  const filtrados = (paises || []).filter((p: Pais) =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.includes(busca)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Países{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtrados?.length || 0} país(es)`}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Novo País
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar país..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 max-w-lg">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {editId ? "Editar País" : "Novo País"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome *</label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="Ex: Brasil"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Código *</label>
              <input
                type="text"
                value={formCodigo}
                onChange={(e) => setFormCodigo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="Ex: 55"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!formNome || !formCodigo || saveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editId ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filtrados?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {busca ? "Nenhum país encontrado" : "Nenhum país cadastrado"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtrados.map((p: Pais) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{p.nome}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Código: {p.codigo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Excluir ${p.nome}?`)) deleteMutation.mutate(p.id) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
