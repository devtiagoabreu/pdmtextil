"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface ProdutoCru {
  id: number
  codigoPdm: string
  descricao: string
  status: string
  idIntegracaoErpCru?: string
  ativo: boolean
  createdAt: string
}

async function fetchProdutos(): Promise<ProdutoCru[]> {
  const res = await fetch("/api/cadastros/produto-cru")
  if (!res.ok) throw new Error("Falha ao carregar produtos")
  return res.json()
}

const STATUS_LABELS: Record<string, string> = {
  DESENVOLVIMENTO: "Em Desenvolvimento",
  APROVADO: "Aprovado",
  EM_PRODCAO: "Em Produção",
  OBSOLETO: "Obsoleto",
}

export default function ProdutoCruPage() {
  const [search, setSearch] = useState("")

  const { data: produtos = [], isLoading, refetch } = useQuery({
    queryKey: ["produto-cru"],
    queryFn: fetchProdutos,
  })

  const filtered = produtos.filter(p =>
    p.codigoPdm.toLowerCase().includes(search.toLowerCase()) ||
    p.descricao.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Produto excluído com sucesso")
      refetch()
    } catch {
      toast.error("Erro ao excluir produto")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Produtos Cru
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie os produtos cru (tecidos) cadastrados no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cadastros/produto-cru/novo">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por código, descrição..."
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
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum produto encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Código PDM</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Descrição</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">ERP (Cru)</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((produto) => (
                <tr key={produto.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm font-medium">{produto.codigoPdm}</td>
                  <td className="p-4 text-sm">{produto.descricao}</td>
                  <td className="p-4 text-sm text-slate-500">{STATUS_LABELS[produto.status] || produto.status}</td>
                  <td className="p-4 text-sm text-slate-500">{produto.idIntegracaoErpCru || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      produto.ativo
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cadastros/produto-cru/${produto.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(produto.id)}
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
