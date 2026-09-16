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

interface PlanoVistoria {
  id: number
  ativoNome: string
  ativoCodigo: string
  tipoVistoriaNome: string
  periodicidade: string
  responsavelNome?: string | null
  proximaData?: string | null
  ativo: boolean
}

function formatarData(data?: string | null): string {
  if (!data) return "—"
  const d = new Date(data)
  if (isNaN(d.getTime())) return data
  return d.toLocaleDateString("pt-BR")
}

export default function AtivosPlanosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<PlanoVistoria | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)

  const { data: planos = [], isLoading, refetch } = useQuery({
    queryKey: ["ativos-planos"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/planos")
      if (!res.ok) throw new Error("Falha ao carregar planos")
      return res.json()
    },
  })

  const filtered = planos.filter((p: PlanoVistoria) => matchesSearch(p, search))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/ativos/planos/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Plano excluído com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir plano")
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
            Planos de Vistoria
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vínculos entre ativos e tipos de vistoria com periodicidade
          </p>
        </div>
        <Link href="/ativos/planos/novo">
          <Button className="gap-2">
            <PlusCircle size={16} />
            Novo Plano
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por ativo, tipo de vistoria ou periodicidade..."
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
            Nenhum plano encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ativo</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Tipo de Vistoria</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Periodicidade</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Responsável</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Próxima Data</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plano: PlanoVistoria) => (
                <tr
                  key={plano.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="p-4 text-sm">
                    <Link href={`/ativos/planos/${plano.id}`} className="font-medium">
                      {plano.ativoNome}
                    </Link>
                    <span className="ml-2 text-xs text-slate-400">{plano.ativoCodigo}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{plano.tipoVistoriaNome}</td>
                  <td className="p-4 text-sm text-slate-500">{plano.periodicidade}</td>
                  <td className="p-4 text-sm text-slate-500">{plano.responsavelNome || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{formatarData(plano.proximaData)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/ativos/planos/${plano.id}`} onClick={(e) => e.stopPropagation()}>
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
                          setDeleteTarget(plano)
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
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir plano?"}
        message={deleteBlocked
          ? "Este plano possui vistorias vinculadas e não pode ser excluído."
          : "Tem certeza que deseja excluir?"}
        subMessage={deleteBlocked
          ? "Remova ou desvincule os registros associados antes de excluir."
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