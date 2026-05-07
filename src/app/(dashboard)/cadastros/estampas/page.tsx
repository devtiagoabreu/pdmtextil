"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Estampa {
  id: number
  codigoDesenho: string
  variante: string
  nome: string
  tipo?: string
  imagemUrl?: string
  ativo: boolean
}

async function fetchEstampas(): Promise<Estampa[]> {
  const res = await fetch("/api/cadastros/estampas")
  if (!res.ok) throw new Error("Falha ao carregar estampas")
  return res.json()
}

export default function EstampasPage() {
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()
  
  const { data: estampas = [], isLoading } = useQuery({
    queryKey: ["estampas"],
    queryFn: fetchEstampas,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/cadastros/estampas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
    },
    onSuccess: () => {
      toast.success("Estampa excluída")
      queryClient.invalidateQueries({ queryKey: ["estampas"] })
    },
    onError: () => toast.error("Erro ao excluir estampa"),
  })

  const filteredEstampas = estampas.filter(e => 
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    e.codigoDesenho.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Estampas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie as estampas cadastradas no sistema
          </p>
        </div>
        <Link href="/cadastros/estampas/novo">
          <Button className="gap-2">
            <PlusCircle size={16} />
            Nova Estampa
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por nome, código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredEstampas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma estampa encontrada
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Desenho</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Variante</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Tipo</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstampas.map((estampa) => (
                <tr key={estampa.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm font-mono">{estampa.codigoDesenho}</td>
                  <td className="p-4 text-sm font-mono">{estampa.variante}</td>
                  <td className="p-4 text-sm">{estampa.nome}</td>
                  <td className="p-4 text-sm text-slate-500">{estampa.tipo || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      estampa.ativo 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {estampa.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cadastros/estampas/${estampa.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir?")) {
                            deleteMutation.mutate(estampa.id)
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}