"use client"

import { useState, type MouseEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2, Database } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import ImportarCores from "@/components/importar/ImportarCores"
import ImportarApiModal from "@/components/integracao/ImportarApiModal"
import { ExportarDados } from "@/components/exportar/ExportarDados"

interface CorSolida {
  id: number
  codigo: string
  nome: string
  pantone?: string
  familia?: string
  idIntegracao?: string
  ativo: boolean
}

async function fetchCores(): Promise<CorSolida[]> {
  const res = await fetch("/api/cadastros/cores")
  if (!res.ok) throw new Error("Falha ao carregar cores")
  return res.json()
}

export default function CoresPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<CorSolida | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)
  const [showApiImport, setShowApiImport] = useState(false)
  
  const { data: cores = [], isLoading, refetch } = useQuery({
    queryKey: ["cores"],
    queryFn: fetchCores,
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/cadastros/cores/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Cor excluída com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir cor")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredCores = cores.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase()) ||
    (c.pantone && c.pantone.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Cores Sólidas
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie as cores sólidas cadastradas no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <ImportarCores onImportado={() => refetch()} />
          <ExportarDados data={filteredCores} columns={[
            { key: "codigo", label: "Código" }, { key: "nome", label: "Nome" },
            { key: "pantone", label: "Pantone" }, { key: "familia", label: "Família" },
          ]} filename="cores-solidas" title="Cores Sólidas" />
          <Button variant="outline" onClick={() => setShowApiImport(true)} className="gap-2">
            <Database size={16} />
            Importar via API
          </Button>
          <Link href="/cadastros/cores/novo">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Nova Cor
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por nome, código, pantone..."
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
        ) : filteredCores.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma cor encontrada
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Código</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Cor</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Pantone</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Família</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">ID Integração</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCores.map((cor) => (
                <tr
                  key={cor.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => router.push(`/cadastros/cores/${cor.id}`)}
                >
                  <td className="p-4 text-sm font-medium font-mono">{cor.codigo}</td>
                  <td className="p-4 text-sm">{cor.nome}</td>
                  <td className="p-4">
                    <div 
                      className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: `#${cor.codigo}` }}
                    />
                  </td>
                  <td className="p-4 text-sm text-slate-500">{cor.pantone || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{cor.familia || "—"}</td>
                  <td className="p-4 text-sm font-mono text-xs text-slate-500">{cor.idIntegracao || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      cor.ativo 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {cor.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cadastros/cores/${cor.id}`} onClick={(e) => e.stopPropagation()}>
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
                          setDeleteTarget(cor)
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
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir cor?"}
        message={deleteBlocked
          ? "Esta cor possui cadastros vinculados e não pode ser excluída."
          : `Tem certeza que deseja excluir?`}
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

      {showApiImport && (
        <ImportarApiModal
          tela="coresSolidas"
          existingRecords={cores}
          existingKey="idIntegracao"
          onImportado={() => refetch()}
          onClose={() => setShowApiImport(false)}
        />
      )}
    </div>
  )
}
