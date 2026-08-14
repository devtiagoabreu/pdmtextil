"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Building2, Search, UserPlus, Users, Loader2, X, Mail, Phone, MapPin, Plus, Unlink } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { SelectSegmento } from "@/components/crm/select-segmento"

type Cliente = {
  id: number
  nome: string
  cnpj: string
  razaoSocial?: string | null
  email?: string | null
  emailNf?: string | null
  telefone?: string | null
  celular?: string | null
  contato?: string | null
  segmento?: string | null
  endereco?: string | null
  cidade?: string | null
  uf?: string | null
  idIntegracao?: string | null
}

type Vinculo = {
  id: number
  clienteId: number
  representanteId: number
  nome: string
  cnpj: string
  cidade: string
  uf: string
  email: string
  telefone: string
  contato: string
}

async function fetchRepresentantes(query: string) {
  const res = await fetch(`/api/representantes?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error("Falha ao buscar")
  return res.json()
}

async function fetchVinculos(clienteId: string) {
  const res = await fetch(`/api/clientes/${clienteId}/representantes`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

export default function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [id, setId] = useState<string>("")

  const queryClient = useQueryClient()

  const { data: vinculos = [], isLoading: loadingVinculos } = useQuery({
    queryKey: ["cliente-representantes", id],
    queryFn: () => fetchVinculos(id),
    enabled: !!id,
  })

  const [searchRep, setSearchRep] = useState("")
  const [repResults, setRepResults] = useState<any[]>([])
  const [searchingRep, setSearchingRep] = useState(false)
  const [repToRemove, setRepToRemove] = useState<Vinculo | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [contatos, setContatos] = useState<any[]>([])
  const [loadingContatos, setLoadingContatos] = useState(false)
  const [orfaos, setOrfaos] = useState<any[]>([])
  const [contatoSelecionado, setContatoSelecionado] = useState("")

  useEffect(() => {
    async function loadCliente() {
      const { id: clientId } = await params
      setId(clientId)
      try {
        const res = await fetch(`/api/clientes/${clientId}`)
        if (res.ok) {
          const data = await res.json()
          setCliente(data)
        } else {
          toast.error("Cliente não encontrado")
          router.push("/comercial/clientes")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadCliente()
  }, [params, router])

  useEffect(() => {
    if (!id) return
    let ativo = true
    setLoadingContatos(true)
    Promise.all([
      fetch(`/api/crm/contatos?clienteId=${id}`).then((r) => r.json()),
      fetch("/api/crm/contatos?orfao=true").then((r) => r.json()),
    ])
      .then(([cts, orf]) => {
        if (!ativo) return
        if (Array.isArray(cts)) setContatos(cts)
        if (Array.isArray(orf)) setOrfaos(orf)
      })
      .catch(() => toast.error("Erro ao carregar contatos"))
      .finally(() => setLoadingContatos(false))
    return () => {
      ativo = false
    }
  }, [id])

  async function adicionarContato() {
    const nome = prompt("Nome do novo contato:")
    if (!nome) return
    try {
      const res = await fetch("/api/crm/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, clienteId: id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Erro ao criar contato")
      }
      const novo = await res.json()
      setContatos((prev) => [...prev, novo])
      toast.success("Contato adicionado e vinculado ao cliente")
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar contato")
    }
  }

  async function vincularContatoSelecionado() {
    if (!contatoSelecionado) return
    const contatoId = parseInt(contatoSelecionado)
    try {
      const res = await fetch(`/api/crm/contatos/${contatoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Erro ao vincular")
      }
      const atualizado = await res.json()
      setContatos((prev) => [...prev, atualizado])
      setOrfaos((prev) => prev.filter((c: any) => c.id !== contatoId))
      setContatoSelecionado("")
      toast.success("Contato vinculado ao cliente")
    } catch (err: any) {
      toast.error(err.message || "Erro ao vincular contato")
    }
  }

  async function removerContato(contatoId: number) {
    try {
      const res = await fetch(`/api/crm/contatos/${contatoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: null, clienteId: null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Erro ao desvincular")
      }
      const atualizado = await res.json()
      setContatos((prev) => prev.filter((c: any) => c.id !== contatoId))
      setOrfaos((prev) => [...prev, atualizado])
      toast.success("Contato desvinculado do cliente")
    } catch (err: any) {
      toast.error(err.message || "Erro ao desvincular contato")
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
      const existentes = new Set(vinculos.map((v: any) => v.representanteId))
      setRepResults(data.filter((r: any) => !existentes.has(r.id)))
    } catch {
      setRepResults([])
    } finally {
      setSearchingRep(false)
    }
  }

  async function addRepresentante(representanteId: number) {
    try {
      const res = await fetch(`/api/clientes/${id}/representantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representanteId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao adicionar")
      }
      queryClient.invalidateQueries({ queryKey: ["cliente-representantes", id] })
      setSearchRep("")
      setRepResults([])
      toast.success("Representante vinculado ao cliente")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function removeRepresentante(vinculo: Vinculo) {
    try {
      await fetch(`/api/clientes/${id}/representantes?vinculoId=${vinculo.id}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["cliente-representantes", id] })
      toast.success("Representante removido do cliente")
    } catch {
      toast.error("Erro ao remover")
    }
    setRepToRemove(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!cliente) return

    setSaving(true)
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
      })

      if (res.ok) {
        toast.success("Cliente atualizado com sucesso!")
        router.push("/comercial/clientes")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao atualizar")
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar cliente")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Cliente, value: string) => {
    setCliente((prev) => prev ? { ...prev, [field]: value } : null)
  }

  const handleCheckboxChange = (field: keyof Cliente, checked: boolean) => {
    setCliente((prev) => prev ? { ...prev, [field]: checked } : null)
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Erro ao excluir")
      }
      toast.success("Cliente excluído com sucesso!")
      router.push("/comercial/clientes")
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir cliente")
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/comercial/clientes"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Voltar para Clientes
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Editar Cliente{info && <InfoButton content={info} />}</h1>
            <p className="text-sm text-slate-500">{cliente.nome}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nome / Fantasia *
              </label>
              <input
                type="text"
                value={cliente.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                CNPJ *
              </label>
              <input
                type="text"
                value={cliente.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Razão Social
              </label>
              <input
                type="text"
                value={cliente.razaoSocial || ""}
                onChange={(e) => handleChange("razaoSocial", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Segmento
              </label>
              <SelectSegmento value={cliente.segmento || ""} onChange={v => handleChange("segmento", v)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={cliente.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                E-mail p/ Nota Fiscal
              </label>
              <input
                type="email"
                value={cliente.emailNf || ""}
                onChange={(e) => handleChange("emailNf", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Telefone
              </label>
              <input
                type="text"
                value={cliente.telefone || ""}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Celular
              </label>
              <input
                type="text"
                value={cliente.celular || ""}
                onChange={(e) => handleChange("celular", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Contato
              </label>
              <input
                type="text"
                value={cliente.contato || ""}
                onChange={(e) => handleChange("contato", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cidade
              </label>
              <input
                type="text"
                value={cliente.cidade || ""}
                onChange={(e) => handleChange("cidade", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                UF
              </label>
              <input
                type="text"
                value={cliente.uf || ""}
                onChange={(e) => handleChange("uf", e.target.value)}
                maxLength={2}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm uppercase"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Endereço
              </label>
              <input
                type="text"
                value={cliente.endereco || ""}
                onChange={(e) => handleChange("endereco", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ID Integração (ERP/WMS/CRM/OUTROS)
              </label>
              <input
                type="text"
                value={cliente.idIntegracao || ""}
                onChange={(e) => handleChange("idIntegracao", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                placeholder="Código do sistema externo"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Representantes Vinculados ({vinculos.length})
            </h2>

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
                    onClick={() => addRepresentante(r.id)}
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

            {loadingVinculos ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : vinculos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-500">Nenhum representante vinculado</p>
                <p className="text-xs text-slate-400 mt-1">Busque acima para vincular representantes</p>
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
                    {vinculos.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-sm font-medium text-slate-900 dark:text-slate-200">{v.nome}</td>
                        <td className="p-3 text-sm text-slate-500 font-mono">{v.cnpj || "—"}</td>
                        <td className="p-3 text-sm text-slate-500">
                          <div className="flex flex-col gap-0.5">
                            {v.email && <span className="flex items-center gap-1"><Mail size={12} />{v.email}</span>}
                            {v.telefone && <span className="flex items-center gap-1"><Phone size={12} />{v.telefone}</span>}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-500">
                          {v.cidade ? <span className="flex items-center gap-1"><MapPin size={12} />{v.cidade}/{v.uf}</span> : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setRepToRemove(v)}
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

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Contatos Vinculados ({contatos.length})
            </h2>

            <div className="flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <select
                  aria-label="Contatos sem vínculo"
                  value={contatoSelecionado}
                  onChange={(e) => setContatoSelecionado(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Vincular contato existente...</option>
                  {orfaos.map((c: any) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nome}
                      {c.email ? ` — ${c.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={vincularContatoSelecionado}
                disabled={!contatoSelecionado}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <UserPlus size={14} />
                Vincular
              </button>
              <button
                type="button"
                onClick={adicionarContato}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Plus size={14} />
                Adicionar contato
              </button>
            </div>

            {loadingContatos ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : contatos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-500">Nenhum contato vinculado</p>
                <p className="text-xs text-slate-400 mt-1">Vincule um contato existente ou adicione um novo</p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Nome</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Email</th>
                      <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Telefone</th>
                      <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {contatos.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-sm font-medium text-slate-900 dark:text-slate-200">
                          <Link href={`/comercial/crm/contatos/${c.id}`} className="hover:underline">
                            {c.nome}
                          </Link>
                        </td>
                        <td className="p-3 text-sm text-slate-500">{c.email || "—"}</td>
                        <td className="p-3 text-sm text-slate-500">{c.telefone || c.celular || "—"}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => removerContato(c.id)}
                            title="Desvincular contato"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Unlink size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} />
              Excluir Cliente
            </button>
            <div className="flex gap-2">
              <Link
                href="/comercial/clientes"
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        open={!!repToRemove}
        title="Remover representante"
        message={`Deseja remover ${repToRemove?.nome} deste cliente?`}
        variant="danger"
        confirmLabel="Remover"
        onConfirm={() => repToRemove && removeRepresentante(repToRemove)}
        onCancel={() => setRepToRemove(null)}
      />
      <ConfirmModal
        open={showDelete}
        title="Excluir cliente?"
        message={`Tem certeza que deseja excluir "${cliente.nome}"? Os vínculos de representantes serão removidos e os registros de CRM (pessoas, contatos, oportunidades, propostas, visitas) ficarão sem cliente vinculado. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}