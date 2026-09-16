"use client"

import { useState, type MouseEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Input } from "@/components/ui/input"
import { matchesSearch } from "@/components/ui/list-filters"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface TipoVistoria {
  id: number
  nome: string
  areaId: number
  areaNome?: string | null
  periodicidade: string
  baseLegal?: string | null
  ativo: boolean
}

export default function AtivosTiposVistoriaPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<TipoVistoria | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)

  const {
    data: tipos = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ativos-tipos-vistoria"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/tipos-vistoria")
      if (!res.ok) throw new Error("Falha ao carregar tipos de vistoria")
      return res.json()
    },
  })

  const filtered = tipos.filter((t: TipoVistoria) => matchesSearch(t, search))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/ativos/tipos-vistoria/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Tipo de vistoria excluído com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir tipo de vistoria")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Tipos de Vistoria
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Modelos de inspeção com periodicidade e checklist
          </p>
        </div>
        <Link href="/ativos/tipos-vistoria/novo">
          <Button className="gap-2">
            <PlusCircle size={16} />
            Novo Tipo
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por nome, área ou base legal..."
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
          <div className="p-8 text-center text-slate-500">Nenhum tipo de vistoria encontrado</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                  Nome
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                  Área
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                  Periodicidade
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                  Base Legal
                </th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tipo: TipoVistoria) => (
                <tr
                  key={tipo.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="p-4 text-sm font-medium">
                    <Link href={`/ativos/tipos-vistoria/${tipo.id}`}>{tipo.nome}</Link>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {tipo.areaNome || "—"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{tipo.periodicidade}</td>
                  <td className="p-4 text-sm text-slate-500 line-clamp-1">
                    {tipo.baseLegal || "—"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/ativos/tipos-vistoria/${tipo.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation()
                          setDeleteTarget(tipo)
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
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir tipo de vistoria?"}
        message={
          deleteBlocked
            ? "Este tipo de vistoria possui planos vinculados e não pode ser excluído."
            : "Tem certeza que deseja excluir?"
        }
        subMessage={
          deleteBlocked
            ? "Remova ou desvincule os registros associados antes de excluir."
            : undefined
        }
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
