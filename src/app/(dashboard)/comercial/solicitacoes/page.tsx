"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { PlusCircle, FileText, Clock, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  PENDENTE:       { label: "Pendente",       classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  AGUARDANDO_INFO:{ label: "Aguard. Info",   classes: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  EM_DESENVOLVIMENTO: { label: "Em Desenvolvimento", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  APROVADO:       { label: "Aprovado",       classes: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400" },
  REPROVADO:      { label: "Reprovado",      classes: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  EM_PRODUCAO:    { label: "Em Produção",    classes: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" },
  CONCLUIDO:      { label: "Concluído",      classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

const TIPO_CONFIG: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM:      "Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Beneficiamento",
}

async function fetchSolicitacoes() {
  const res = await fetch("/api/solicitacoes")
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Falha ao carregar")
  }
  return res.json()
}

export default function ListaSolicitacoesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [mounted, setMounted] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: lista, isLoading, error, refetch } = useQuery({
    queryKey: ["solicitacoes"],
    queryFn: fetchSolicitacoes,
    retry: 1,
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/solicitacoes/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Solicitação excluída com sucesso")
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-2">Erro ao carregar solicitações</p>
        <p className="text-sm text-slate-500">Tente fazer login novamente</p>
        <Link href="/login" className="text-blue-600 hover:underline mt-2 inline-block">
          Ir para login
        </Link>
      </div>
    )
  }

  if (!lista || !Array.isArray(lista)) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Erro ao carregar solicitações</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Minhas Solicitações{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {lista?.length || 0} solicitação(ões)
          </p>
        </div>
        <Link
          href="/comercial/solicitacoes/nova"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Nova Solicitação
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {(!lista || lista.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma solicitação encontrada</p>
            <Link href="/comercial/solicitacoes/nova" className="text-sm text-blue-600 hover:underline mt-2">
              Criar primeira solicitação
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Criado por</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Produto Aprovado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Observações</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lista.map((s: any) => {
                  const statusCfg = STATUS_CONFIG[s.status] ?? { label: s.status, classes: "bg-slate-100 text-slate-600" }
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => router.push(`/comercial/solicitacoes/${s.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">#{s.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{TIPO_CONFIG[s.tipo] || s.tipo}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">{s.cliente}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{s.solicitanteNome || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {s.produtoCodigoPdm ? (
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                            {s.produtoCodigoPdm}{s.produtoIdIntegracaoErpCru ? ` (ERP: ${s.produtoIdIntegracaoErpCru})` : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={s.observacoes || ""}>
                        {s.observacoes || "—"}
                      </td>
                      <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/comercial/solicitacoes/${s.id}`}
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver
                            </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(s)
                              setDeleteBlocked(false)
                            }}
                            className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir solicitação?"}
        message={deleteBlocked
          ? "Esta solicitação possui cadastros vinculados e não pode ser excluída."
          : deleteTarget?.anexosCount > 0
            ? `Esta solicitação possui ${deleteTarget?.anexosCount} link(s) anexado(s). Ao excluir, os links também serão removidos. Continuar?`
            : `Tem certeza que deseja excluir a solicitação #${deleteTarget?.id}?`}
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