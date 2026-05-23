"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import ImportarBasesUrdume from "@/components/importar/ImportarBasesUrdume"

interface BaseUrdume {
  id: number
  codigoCompleto: string
  codigoBase: string
  nome: string
  descricao?: string
  densidade?: string
  tratamento?: string
  largura?: string
  idIntegracao?: string
  ativo: boolean
  createdAt: string
}

async function fetchBases(): Promise<BaseUrdume[]> {
  const res = await fetch("/api/cadastros/bases-urdume")
  if (!res.ok) throw new Error("Falha ao carregar bases de urdume")
  return res.json()
}

export default function BasesUrdumePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<BaseUrdume | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)

  const { data: bases = [], isLoading, refetch } = useQuery({
    queryKey: ["bases-urdume"],
    queryFn: fetchBases,
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/cadastros/bases-urdume/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Base de urdume excluída com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir base")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredBases = bases.filter(b => 
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    b.codigoBase.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Bases de Urdume
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie as bases de urdume cadastradas no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <ImportarBasesUrdume onImportado={() => refetch()} />
          <Link href="/cadastros/bases-urdume/novo">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Nova Base
            </Button>
          </Link>
        </div>
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
        ) : filteredBases.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma base de urdume encontrada
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Código</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Densidade</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Largura</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Tratamento</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">ID Integração</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBases.map((base) => (
                <tr
                  key={base.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => router.push(`/cadastros/bases-urdume/${base.id}`)}
                >
                  <td className="p-4 text-sm font-medium">{base.codigoBase}</td>
                  <td className="p-4 text-sm">{base.nome}</td>
                  <td className="p-4 text-sm text-slate-500">{base.densidade || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{base.largura || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{base.tratamento || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{base.idIntegracao || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      base.ativo 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {base.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cadastros/bases-urdume/${base.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(base)
                          setDeleteBlocked(false)
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

      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir base de urdume?"}
        message={deleteBlocked
          ? "Esta base de urdume possui cadastros vinculados e não pode ser excluída."
          : `Tem certeza que deseja excluir a base "${deleteTarget?.codigoBase}"?`}
        subMessage={deleteBlocked
          ? "Remova ou desvincule os registros associados antes de excluir. Entre em contato com o administrador para mais informações."
          : undefined}
        confirmLabel={deleteBlocked ? "OK" : "Excluir"}
        variant={deleteBlocked ? "warning" : "danger"}
        loading={deleteLoading}
        onConfirm={() => {
          if (deleteBlocked) {
            setDeleteTarget(null)
            setDeleteBlocked(false)
            return
          }
          handleDelete()
        }}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteBlocked(false)
        }}
      />
    </div>
  )
}