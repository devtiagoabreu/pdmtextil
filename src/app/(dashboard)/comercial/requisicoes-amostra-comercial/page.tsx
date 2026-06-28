"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { FlaskConical, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"

export default function ListaRequisicoesAmostraComercialPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [mounted, setMounted] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { getLabel, getColor } = useStatuses("AMOSTRA_COMERCIAL")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch("/api/requisicoes-amostra-comercial")
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => {
        const arr = Array.isArray(d) ? d : []
        setData(arr)
        setFiltered(arr)
      })
      .catch(() => toast.error("Erro ao carregar requisições"))
      .finally(() => setLoading(false))
  }, [mounted])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      data.filter(item =>
        String(item.id).includes(q) ||
        (item.titulo || "").toLowerCase().includes(q) ||
        (item.cliente || "").toLowerCase().includes(q) ||
        (item.produtoCodigo || "").toLowerCase().includes(q) ||
        (item.produtoDescricao || "").toLowerCase().includes(q)
      )
    )
  }, [search, data])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/requisicoes-amostra-comercial/${deleteTarget.id}`, { method: "DELETE" })
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
            Requisições de Amostra Comercial{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} requisição(ões)
          </p>
        </div>
        <Link
          href="/comercial/requisicoes-amostra-comercial/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nova Requisição
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar por ID, título, cliente ou produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FlaskConical className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma requisição encontrada</p>
            <Link href="/comercial/requisicoes-amostra-comercial/novo" className="text-sm text-blue-600 hover:underline mt-2">
              Criar primeira requisição
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => router.push(`/comercial/requisicoes-amostra-comercial/${item.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">#{item.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{item.titulo || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.cliente || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        {item.produtoCodigo || "—"}
                      </span>
                      {item.produtoDescricao && (
                        <p className="text-xs text-slate-400 line-clamp-1">{item.produtoDescricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{
                        backgroundColor: hexToRgba(getColor(item.status), 0.15),
                        color: getColor(item.status),
                      }}>
                        {getLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/comercial/requisicoes-amostra-comercial/${item.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                        >
                          Visualizar
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Excluir requisição?"
        message={`Tem certeza que deseja excluir a requisição #${deleteTarget?.id} — ${deleteTarget?.titulo || ""}?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
