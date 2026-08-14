"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
  PlusCircle, Search, Users,
  Star, StarOff, Phone, Mail,
  Building2, User, Pencil, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ListFilters, { useListFilters } from "@/components/ui/list-filters"

async function fetchContatos() {
  const res = await fetch("/api/crm/contatos")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

export default function CrmContatosPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUDO"
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { data: contatos, isLoading, refetch } = useQuery({
    queryKey: ["crm-contatos"],
    queryFn: fetchContatos,
    retry: 1,
  })

  const filterState = useListFilters(
    { searchFields: ["nome", "email", "cargo", "empresaRazaoSocial", "empresaNomeFantasia"],
      dateField: "createdAt",
    },
    contatos || []
  )
  const filteredData = filterState.filtered

  function empresaNome(c: any) {
    return c.empresaRazaoSocial || c.empresaNomeFantasia || c.empresaNome || "—"
  }

  async function excluirContato(c: any) {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/contatos/${c.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Erro ao excluir")
      }
      toast.success(`Contato "${c.nome}" excluído`)
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Contatos{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filteredData.length} de ${(contatos || []).length} total`}
          </p>
        </div>
        <Link
          href="/comercial/crm/contatos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Novo Contato
        </Link>
      </div>

      <ListFilters
        config={{
          searchFields: ["nome", "email", "cargo", "empresaRazaoSocial", "empresaNomeFantasia"],
          dateField: "createdAt",
        }}
        data={contatos || []}
        filterState={filterState}
        placeholder="Buscar contatos..."
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum contato encontrado</p>
            <Link href="/comercial/crm/contatos/novo" className="text-sm text-blue-600 hover:underline mt-1">
              Cadastrar primeiro contato
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Principal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cargo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Celular</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      {c.principal ? (
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                      ) : (
                        <StarOff size={14} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">
                      <Link href={`/comercial/crm/contatos/${c.id}`} className="hover:underline">
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.cargo || "—"}</td>
                    <td className="px-4 py-3">
                      {c.empresaId ? (
                        <Link
                          href={`/comercial/crm/pessoas/${c.empresaId}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Building2 size={12} />
                          {empresaNome(c)}
                        </Link>
                      ) : c.clienteId ? (
                        <Link
                          href={`/comercial/crm/clientes/${c.clienteId}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                        >
                          <User size={12} />
                          {c.clienteNome || "—"}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {c.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" />
                          {c.email}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {c.celular ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {c.celular}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/comercial/crm/contatos/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Pencil size={12} />
                          Editar
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(c)}
                            title="Excluir contato"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
        open={!!deleteTarget}
        title="Excluir contato?"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Oportunidades, visitas e conversas vinculadas ficarão sem este contato. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={() => deleteTarget && excluirContato(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
