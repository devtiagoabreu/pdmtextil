"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Scissors, Plus, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  SOLICITADO: { label: "Solicitado", classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  PROCESSANDO: { label: "Processando", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  ATENDIDO: { label: "Atendido", classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

export default function ListaRequisicoesCortePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch("/api/comercial/requisicoes-corte")
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Erro ao carregar requisições"))
      .finally(() => setLoading(false))
  }, [mounted])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/comercial/requisicoes-corte/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao excluir")
      }
      toast.success("Requisição excluída com sucesso")
      setDeleteTarget(null)
      setData(prev => prev.filter(item => item.id !== deleteTarget.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Requisições de Corte{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {data.length} requisição(ões)
          </p>
        </div>
        <Link
          href="/comercial/requisicoes-corte/nova"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nova Requisição
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Scissors className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma requisição encontrada</p>
            <Link href="/comercial/requisicoes-corte/nova" className="text-sm text-blue-600 hover:underline mt-2">
              Criar primeira requisição
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Requisitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cód. Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ordem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Artigo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Quantidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((item: any) => {
                  const statusCfg = STATUS_CONFIG[item.status] ?? { label: item.status, classes: "bg-slate-100 text-slate-600" }
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => router.push(`/comercial/requisicoes-corte/${item.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">#{item.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.requisitante || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.codigoProduto || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.ordem || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.artigo || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.cor || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.quantidade || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/comercial/requisicoes-corte/${item.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(item)
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
        title="Excluir requisição?"
        message={`Tem certeza que deseja excluir a requisição #${deleteTarget?.id}?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
