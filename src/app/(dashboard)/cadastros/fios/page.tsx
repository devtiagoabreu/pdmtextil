"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Fio {
  id: number
  codigoCompleto: string
  codigoFio: string
  nome: string
  nomeComercial?: string
  composicao?: string
  titulo?: string
  fornecedor?: string
  ativo: boolean
  createdAt: string
}

async function fetchFios(): Promise<Fio[]> {
  const res = await fetch("/api/cadastros/fios")
  if (!res.ok) throw new Error("Falha ao carregar fios")
  return res.json()
}

export default function FiosPage() {
  const [search, setSearch] = useState("")
  
  const { data: fios = [], isLoading, refetch } = useQuery({
    queryKey: ["fios"],
    queryFn: fetchFios,
  })

  const filteredFios = fios.filter(f => 
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.codigoFio.toLowerCase().includes(search.toLowerCase()) ||
    f.codigoCompleto.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fio?")) return
    
    try {
      const res = await fetch(`/api/cadastros/fios/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Fio excluído com sucesso")
      refetch()
    } catch {
      toast.error("Erro ao excluir fio")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Fios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie os fios cadastrados no sistema
          </p>
        </div>
        <Link href="/cadastros/fios/novo">
          <Button className="gap-2">
            <PlusCircle size={16} />
            Novo Fio
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
        ) : filteredFios.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum fio encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Código</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Título</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Composição</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Fornecedor</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFios.map((fio) => (
                <tr key={fio.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm font-medium">{fio.codigoFio}</td>
                  <td className="p-4 text-sm">{fio.nome}</td>
                  <td className="p-4 text-sm text-slate-500">{fio.titulo || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{fio.composicao || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{fio.fornecedor || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      fio.ativo 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {fio.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cadastros/fios/${fio.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(fio.id)}
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