"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useState } from "react"
import { Globe, Pencil, Loader2, Search, Check, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { REGIAO_LABELS } from "@/lib/db/schema/crm-regioes"

const REGIAO_SIGLAS = ["N", "NE", "CO", "SE", "S"]

type Estado = { id: number; nome: string; uf: string; regiao: string | null; gerenteId: number | null; gerenteNome: string | null }
type Usuario = { id: number; name: string }

async function fetchEstados() {
  const res = await fetch("/api/crm/estados")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

async function fetchUsuarios() {
  const res = await fetch("/api/usuarios/ativos")
  if (!res.ok) throw new Error("Falha ao carregar usuários")
  return res.json()
}

export default function EstadosConfigPage() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [busca, setBusca] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editRegiao, setEditRegiao] = useState("")
  const [editGerenteId, setEditGerenteId] = useState("")

  const { data: estados, isLoading } = useQuery({
    queryKey: ["crm-estados"],
    queryFn: fetchEstados,
  })

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-ativos"],
    queryFn: fetchUsuarios,
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, regiao, gerenteId }: { id: number; regiao: string; gerenteId: string }) => {
      const res = await fetch(`/api/crm/estados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regiao: regiao || null,
          gerenteId: gerenteId ? parseInt(gerenteId) : null,
        }),
      })
      if (!res.ok) throw new Error("Falha ao salvar")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-estados"] })
      setEditId(null)
    },
  })

  function startEdit(estado: Estado) {
    setEditId(estado.id)
    setEditRegiao(estado.regiao || "")
    setEditGerenteId(estado.gerenteId ? String(estado.gerenteId) : "")
  }

  const filtrados = (estados || []).filter((e: Estado) =>
    !busca || e.nome.toLowerCase().includes(busca.toLowerCase()) || e.uf.toLowerCase().includes(busca.toLowerCase())
  )

  const getRegiaoLabel = (sigla: string | null) => sigla ? (REGIAO_LABELS[sigla] || sigla) : "—"
  const getGerenteNome = (id: number | null) => {
    if (!id) return null
    const u = (usuarios || []).find((u: Usuario) => u.id === id)
    return u?.name || null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Estados (UF){info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtrados?.length || 0} estado(s)`}
          </p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar estado..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filtrados?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {busca ? "Nenhum estado encontrado" : "Nenhum estado cadastrado"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase">UF</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase">Região</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase">Gerente</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtrados.map((e: Estado) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{e.uf}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{e.nome}</td>
                    <td className="px-4 py-3">
                      {editId === e.id ? (
                        <select
                          value={editRegiao}
                          onChange={(e) => setEditRegiao(e.target.value)}
                          className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="">Selecione...</option>
                          {REGIAO_SIGLAS.map(s => (
                            <option key={s} value={s}>{s} — {REGIAO_LABELS[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">{getRegiaoLabel(e.regiao)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editId === e.id ? (
                        <select
                          value={editGerenteId}
                          onChange={(e) => setEditGerenteId(e.target.value)}
                          className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="">Sem gerente</option>
                          {(usuarios || []).map((u: Usuario) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">{getGerenteNome(e.gerenteId) || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editId === e.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => saveMutation.mutate({ id: e.id, regiao: editRegiao, gerenteId: editGerenteId })}
                            disabled={saveMutation.isPending}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(e)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <Pencil size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
