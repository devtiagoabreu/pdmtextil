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

interface Ativo {
  id: number
  codigo: string
  nome: string
  categoriaNome?: string | null
  localizacao?: string | null
  status: string
  maquinaNome?: string | null
  responsavelNome?: string | null
  ativo: boolean
}

const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  MANUTENCAO: "Manutenção",
  INATIVO: "Inativo",
  BAIXADO: "Baixado",
}

const STATUS_STYLES: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MANUTENCAO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  INATIVO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  BAIXADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function AtivosAtivosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Ativo | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)

  const { data: ativos = [], isLoading, refetch } = useQuery({
    queryKey: ["ativos-ativos"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/ativos")
      if (!res.ok) throw new Error("Falha ao carregar ativos")
      return res.json()
    },
  })

  const filtered = ativos.filter((a: Ativo) => matchesSearch(a, search))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/ativos/ativos/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Ativo excluído com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir ativo")
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
            Ativos
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Equipamentos e itens cadastrados para vistoria
          </p>
        </div>
        <Link href="/ativos/ativos/novo">
          <Button className="gap-2">
            <PlusCircle size={16} />
            Novo Ativo
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por código, nome, categoria ou localização..."
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
            Nenhum ativo encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Código</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Categoria</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Localização</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Responsável</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ativo: Ativo) => (
                <tr
                  key={ativo.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="p-4 text-sm font-medium text-slate-500">{ativo.codigo}</td>
                  <td className="p-4 text-sm font-medium">
                    <Link href={`/ativos/ativos/${ativo.id}`}>
                      {ativo.nome}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{ativo.categoriaNome || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{ativo.localizacao || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ativo.status] || STATUS_STYLES.INATIVO}`}>
                      {STATUS_LABELS[ativo.status] || ativo.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{ativo.responsavelNome || "—"}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/ativos/ativos/${ativo.id}`} onClick={(e) => e.stopPropagation()}>
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
                          setDeleteTarget(ativo)
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
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir ativo?"}
        message={deleteBlocked
          ? "Este ativo possui vistorias ou planos vinculados e não pode ser excluído."
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