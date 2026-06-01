"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, Pencil, Trash2, Loader2, Upload, Database } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import ImportarClientes from "@/components/importar/ImportarClientes"
import ImportarApiModal from "@/components/integracao/ImportarApiModal"
import { ExportarDados } from "@/components/exportar/ExportarDados"

interface Cliente {
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

async function fetchClientes(): Promise<Cliente[]> {
  const res = await fetch("/api/cadastros/clientes")
  if (!res.ok) throw new Error("Falha ao carregar clientes")
  return res.json()
}

export default function ClientesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)
  const [showApiImport, setShowApiImport] = useState(false)

  const { data: clientes = [], isLoading, refetch } = useQuery({
    queryKey: ["clientes"],
    queryFn: fetchClientes,
  })

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/cadastros/clientes/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Cliente excluído com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir cliente")
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
            Clientes
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie os clientes do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <ImportarClientes onImportado={() => refetch()} />
          <ExportarDados data={filteredClientes} columns={[
            { key: "nome", label: "Nome" }, { key: "cnpj", label: "CNPJ" }, { key: "email", label: "Email" },
            { key: "telefone", label: "Telefone" }, { key: "cidade", label: "Cidade" }, { key: "uf", label: "UF" },
          ]} filename="clientes" title="Clientes" />
          <Button variant="outline" onClick={() => setShowApiImport(true)} className="gap-2">
            <Database size={16} />
            Importar via API
          </Button>
          <Link href="/comercial/clientes/novo">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Novo Cliente
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
        ) : filteredClientes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum cliente encontrado
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
              {filteredClientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => router.push(`/comercial/clientes/${cliente.id}`)}
                >
                  <td className="p-4 text-sm font-medium">{cliente.nome}</td>
                  <td className="p-4 text-sm text-slate-500">{cliente.cnpj || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{cliente.email || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">{cliente.telefone || "—"}</td>
                  <td className="p-4 text-sm text-slate-500">
                    {cliente.cidade && cliente.uf ? `${cliente.cidade}/${cliente.uf}` : "—"}
                  </td>
                  <td className="p-4 text-sm font-mono text-xs text-slate-500">{cliente.idIntegracao || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      cliente.ativo
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/comercial/clientes/${cliente.id}`} onClick={(e) => e.stopPropagation()}>
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
                          setDeleteTarget(cliente)
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
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir cliente?"}
        message={deleteBlocked
          ? "Este cliente possui cadastros vinculados e não pode ser excluído."
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
          tela="clientes"
          existingRecords={clientes}
          existingKey="idIntegracao"
          onImportado={() => refetch()}
          onClose={() => setShowApiImport(false)}
        />
      )}
    </div>
  )
}
