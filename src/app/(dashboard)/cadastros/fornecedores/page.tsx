"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import ImportarFornecedores from "@/components/importar/ImportarFornecedores"

interface Fornecedor {
  id: number
  nome: string
  cnpj?: string
  razaoSocial?: string
  email?: string
  telefone?: string
  contato?: string
  cidade?: string
  uf?: string
  idIntegracao?: string
  ativo: boolean
}

async function fetchFornecedores(): Promise<Fornecedor[]> {
  const res = await fetch("/api/cadastros/fornecedores")
  if (!res.ok) throw new Error("Falha ao carregar fornecedores")
  return res.json()
}

export default function FornecedoresPage() {
  const [search, setSearch] = useState("")
  
  const { data: fornecedores = [], isLoading, refetch } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: fetchFornecedores,
  })

  const filteredFornecedores = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.cnpj?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return
    
    try {
      const res = await fetch(`/api/cadastros/fornecedores/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Fornecedor excluído com sucesso")
      refetch()
    } catch {
      toast.error("Erro ao excluir fornecedor")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Fornecedores
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie os fornecedores do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <ImportarFornecedores onImportado={() => refetch()} />
          <Link href="/cadastros/fornecedores/novo">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Novo Fornecedor
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por nome, CNPJ ou email..."
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
        ) : filteredFornecedores.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum fornecedor encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">CNPJ</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Email</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Telefone</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Cidade/UF</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">ID Integração</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFornecedores.map((fornecedor) => (
                <tr key={fornecedor.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm font-medium">{fornecedor.nome}</td>
                  <td className="p-4 text-sm text-slate-500">{fornecedor.cnpj || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{fornecedor.email || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{fornecedor.telefone || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">
                    {fornecedor.cidade && fornecedor.uf ? `${fornecedor.cidade}/${fornecedor.uf}` : "—"}
                  </td>
                  <td className="p-4 text-sm font-mono text-xs text-slate-500">{fornecedor.idIntegracao || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      fornecedor.ativo 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {fornecedor.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cadastros/fornecedores/${fornecedor.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(fornecedor.id)}
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