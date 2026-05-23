"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import ImportarFios from "@/components/importar/ImportarFios"

interface Fio {
  id: number
  codigoCompleto: string
  codigoFio: string
  nome: string
  nomeComercial?: string
  composicao?: string
  titulo?: string
  fornecedor?: string
  idIntegracao?: string
  ativo: boolean
  createdAt: string
}

async function fetchFios(): Promise<Fio[]> {
  const res = await fetch("/api/cadastros/fios")
  if (!res.ok) throw new Error("Falha ao carregar fios")
  return res.json()
}

export default function FiosPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Fio | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)

  const { data: fios = [], isLoading, refetch } = useQuery({
    queryKey: ["fios"],
    queryFn: fetchFios,
  })

  const filteredFios = fios.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.codigoFio.toLowerCase().includes(search.toLowerCase()) ||
    f.codigoCompleto.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/cadastros/fios/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Fio excluído com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir fio")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
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
        <div className="flex gap-2">
          <ImportarFios onImportado={() => refetch()} />
          <Link href="/cadastros/fios/novo">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Novo Fio
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
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">ID Integração</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFios.map((fio) => (
                <tr
                  key={fio.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => router.push(`/cadastros/fios/${fio.id}`)}
                >
                  <td className="p-4 text-sm font-medium">{fio.codigoFio}</td>
                  <td className="p-4 text-sm">{fio.nome}</td>
                  <td className="p-4 text-sm text-slate-500">{fio.titulo || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{fio.composicao || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{fio.fornecedor || "—"}</td>
                  <td className="p-4 text-sm font-mono text-xs text-slate-500">{fio.idIntegracao || "—"}</td>
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
                      <Link href={`/cadastros/fios/${fio.id}`} onClick={(e) => e.stopPropagation()}>
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
                          setDeleteTarget(fio)
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
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir fio?"}
        message={deleteBlocked
          ? "Este fio possui cadastros vinculados e não pode ser excluído."
          : `Tem certeza que deseja excluir o fio "${deleteTarget?.codigoFio}"?`}
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
