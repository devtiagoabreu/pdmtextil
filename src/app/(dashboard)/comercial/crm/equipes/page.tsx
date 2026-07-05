"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useState } from "react"
import { PlusCircle, Users, Pencil, Trash2, Loader2, Search, X, UserPlus, MapPin, Phone, Mail, ChevronLeft } from "lucide-react"
import { toast } from "sonner"

async function fetchEquipes() {
  const res = await fetch("/api/crm/equipes")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

async function fetchRegioes() {
  const res = await fetch("/api/crm/regioes")
  if (!res.ok) throw new Error("Falha ao carregar regiões")
  return res.json()
}

async function fetchUsuarios() {
  const res = await fetch("/api/usuarios/ativos")
  if (!res.ok) throw new Error("Falha ao carregar usuários")
  return res.json()
}

async function fetchMembros(equipeId: number) {
  const res = await fetch(`/api/crm/equipes/${equipeId}/membros`)
  if (!res.ok) throw new Error("Falha ao carregar membros")
  return res.json()
}

async function fetchRepresentantes(query: string) {
  const res = await fetch(`/api/representantes?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error("Falha ao buscar")
  return res.json()
}

export default function EquipesPage() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState("")
  const [regiaoId, setRegiaoId] = useState("")
  const [responsavelId, setResponsavelId] = useState("")
  const [busca, setBusca] = useState("")

  const [selectedEquipe, setSelectedEquipe] = useState<any | null>(null)
  const [membros, setMembros] = useState<any[]>([])
  const [loadingMembros, setLoadingMembros] = useState(false)
  const [searchRep, setSearchRep] = useState("")
  const [repResults, setRepResults] = useState<any[]>([])
  const [searchingRep, setSearchingRep] = useState(false)

  const { data: equipes, isLoading } = useQuery({
    queryKey: ["crm-equipes"],
    queryFn: fetchEquipes,
    retry: 1,
  })

  const { data: regioes } = useQuery({
    queryKey: ["crm-regioes"],
    queryFn: fetchRegioes,
    retry: 1,
  })

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-ativos"],
    queryFn: fetchUsuarios,
    retry: 1,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { nome, regiaoId: regiaoId ? parseInt(regiaoId) : null, responsavelId: responsavelId ? parseInt(responsavelId) : null }
      if (editingId) {
        const res = await fetch(`/api/crm/equipes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Falha ao atualizar")
        return res.json()
      }
      const res = await fetch("/api/crm/equipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Falha ao criar")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-equipes"] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/crm/equipes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-equipes"] })
      if (selectedEquipe) setSelectedEquipe(null)
    },
  })

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setNome("")
    setRegiaoId("")
    setResponsavelId("")
  }

  function startEdit(e: any) {
    setEditingId(e.id)
    setNome(e.nome)
    setRegiaoId(e.regiaoId ? String(e.regiaoId) : "")
    setResponsavelId(e.responsavelId ? String(e.responsavelId) : "")
    setShowForm(true)
  }

  async function openEquipe(e: any) {
    setSelectedEquipe(e)
    setLoadingMembros(true)
    setSearchRep("")
    setRepResults([])
    try {
      const data = await fetchMembros(e.id)
      setMembros(data)
    } catch {
      toast.error("Erro ao carregar membros")
    } finally {
      setLoadingMembros(false)
    }
  }

  async function searchRepresentantes(query: string) {
    setSearchRep(query)
    if (query.length < 2) {
      setRepResults([])
      return
    }
    setSearchingRep(true)
    try {
      const data = await fetchRepresentantes(query)
      const existentes = new Set(membros.map((m: any) => m.representanteId))
      setRepResults(data.filter((r: any) => !existentes.has(r.id)))
    } catch {
      setRepResults([])
    } finally {
      setSearchingRep(false)
    }
  }

  async function addMembro(representanteId: number) {
    try {
      const res = await fetch(`/api/crm/equipes/${selectedEquipe.id}/membros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representanteId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao adicionar")
      }
      const data = await fetchMembros(selectedEquipe.id)
      setMembros(data)
      setSearchRep("")
      setRepResults([])
      queryClient.invalidateQueries({ queryKey: ["crm-equipes"] })
      toast.success("Representante adicionado à equipe")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function removeMembro(membro: any) {
    try {
      await fetch(`/api/crm/equipes/${selectedEquipe.id}/membros?membroId=${membro.id}`, { method: "DELETE" })
      const data = await fetchMembros(selectedEquipe.id)
      setMembros(data)
      queryClient.invalidateQueries({ queryKey: ["crm-equipes"] })
      toast.success("Representante removido da equipe")
    } catch {
      toast.error("Erro ao remover")
    }
  }

  const filtradas = equipes?.filter((e: any) =>
    !busca || e.nome.toLowerCase().includes(busca.toLowerCase()) || (e.regiaoNome || "").toLowerCase().includes(busca.toLowerCase()) || (e.responsavelNome || "").toLowerCase().includes(busca.toLowerCase())
  )

  if (selectedEquipe) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => setSelectedEquipe(null)}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ChevronLeft size={16} />
          Voltar para Equipes
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{selectedEquipe.nome}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedEquipe.regiaoNome && `${selectedEquipe.regiaoNome} — `}{selectedEquipe.responsavelNome || "Sem responsável"}
            </p>
          </div>
          <button
            onClick={() => { startEdit(selectedEquipe); setSelectedEquipe(null) }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Membros da Equipe ({membros.length})
            </h2>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar representante por nome ou CNPJ..."
                value={searchRep}
                onChange={(e) => searchRepresentantes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {searchingRep && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando...
            </div>
          )}

          {repResults.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {repResults.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => addMembro(r.id)}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                >
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{r.nome}</span>
                    <span className="text-slate-400 ml-2">{r.cnpj}</span>
                    {r.cidade && <span className="text-slate-400 ml-2">{r.cidade}/{r.uf}</span>}
                  </div>
                  <UserPlus size={14} className="text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {loadingMembros ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : membros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm text-slate-500">Nenhum representante nesta equipe</p>
              <p className="text-xs text-slate-400 mt-1">Busque acima para adicionar representantes</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Nome</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">CNPJ</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Contato</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Cidade/UF</th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {membros.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-sm font-medium text-slate-900 dark:text-slate-200">{m.nome}</td>
                      <td className="p-3 text-sm text-slate-500 font-mono">{m.cnpj || "—"}</td>
                      <td className="p-3 text-sm text-slate-500">
                        <div className="flex flex-col gap-0.5">
                          {m.email && <span className="flex items-center gap-1"><Mail size={12} />{m.email}</span>}
                          {m.telefone && <span className="flex items-center gap-1"><Phone size={12} />{m.telefone}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-500">
                        {m.cidade ? <span className="flex items-center gap-1"><MapPin size={12} />{m.cidade}/{m.uf}</span> : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeMembro(m)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Equipes{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtradas?.length || 0} equipe(s)`}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Nova Equipe
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar equipe..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {editingId ? "Editar Equipe" : "Nova Equipe"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="Ex: Equipe Premium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Região <span className="text-slate-300">(opcional)</span></label>
              <select
                value={regiaoId}
                onChange={(e) => setRegiaoId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">Sem região</option>
                {(regioes || []).filter((r: any) => r.ativo).map((r: any) => (
                  <option key={r.id} value={r.id}>{r.nome}{r.uf ? ` (${r.uf})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Responsável</label>
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">Selecione...</option>
                {(usuarios || []).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!nome || saveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filtradas?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {busca ? "Nenhuma equipe encontrada" : "Nenhuma equipe cadastrada"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtradas.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => openEquipe(e)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{e.nome}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {e.regiaoNome && `${e.regiaoNome} — `}{e.responsavelNome || "Sem responsável"}
                      <span className="ml-2 inline-flex items-center gap-1 text-purple-500">
                        <Users size={11} />
                        {e.membrosCount || 0}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!e.ativo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-medium">Inativo</span>
                  )}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); startEdit(e) }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); if (confirm("Excluir equipe?")) deleteMutation.mutate(e.id) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
