"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, Save, Building2, Search, Loader2, CheckCircle2, AlertCircle, Trash2, Users, UserPlus } from "lucide-react"
import { toast } from "sonner"

type Representante = {
  id: number
  nome: string
  cnpj: string
  razaoSocial?: string | null
  email?: string | null
  telefone?: string | null
  contato?: string | null
  endereco?: string | null
  cidade?: string | null
  uf?: string | null
  gerenteId?: number | null
  idIntegracao?: string | null
  clientes?: { id: number; nome: string }[]
}

export default function EditarRepresentantePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [representante, setRepresentante] = useState<Representante | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [consulting, setConsulting] = useState(false)
  const [consulted, setConsulted] = useState(false)
  const [apiData, setApiData] = useState<any>(null)
  const [id, setId] = useState<string>("")
  const [searchCliente, setSearchCliente] = useState("")
  const [clienteResults, setClienteResults] = useState<any[]>([])
  const [searchingCliente, setSearchingCliente] = useState(false)

  const { data: gerentes = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["usuarios-ativos"],
    queryFn: async () => {
      const res = await fetch("/api/usuarios/ativos?role=COMERCIAL,ADMIN,SUDO")
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
  })

  useEffect(() => {
    async function loadRepresentante() {
      const { id: repId } = await params
      setId(repId)
      try {
        const res = await fetch(`/api/representantes/${repId}`)
        if (res.ok) {
          const data = await res.json()
          setRepresentante({ ...data, clientes: Array.isArray(data.clientes) ? data.clientes : [] })
        } else {
          toast.error("Representante não encontrado")
          router.push("/comercial/representantes")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadRepresentante()
  }, [params, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!representante) return

    setSaving(true)
    try {
      const res = await fetch(`/api/representantes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...representante,
          gerenteId: representante.gerenteId ? Number(representante.gerenteId) : null,
          clientesIds: (representante.clientes || []).map((c) => c.id),
        }),
      })

      if (res.ok) {
        toast.success("Representante atualizado com sucesso!")
        router.push("/comercial/representantes")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao atualizar")
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar representante")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Representante, value: string) => {
    setRepresentante((prev) => prev ? { ...prev, [field]: value } : null)
  }

  const handleNumberChange = (field: keyof Representante, value: string) => {
    setRepresentante((prev) => prev ? { ...prev, [field]: value ? parseInt(value) : null } : null)
  }

  function formatCnpj(v: string) {
    const d = v.replace(/\D/g, "")
    if (d.length !== 14) return v
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  }

  async function handleConsultarCnpj() {
    if (!representante) return
    const digits = (representante.cnpj || "").replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    setConsulting(true)
    setConsulted(false)
    setApiData(null)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      const api = result.apiData
      if (!api) {
        setConsulted(true)
        toast.error("CNPJ não encontrado na Receita Federal")
        return
      }
      setApiData(api)
      setConsulted(true)
      setRepresentante((prev) => prev ? {
        ...prev,
        cnpj: formatCnpj(digits),
        razaoSocial: api.razao_social || prev.razaoSocial,
        endereco: api.logradouro || prev.endereco,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
      } : prev)
      toast.success("Dados preenchidos automaticamente")
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar CNPJ")
    } finally {
      setConsulting(false)
    }
  }

  async function searchClientes(query: string) {
    setSearchCliente(query)
    if (query.length < 2) { setClienteResults([]); return }
    setSearchingCliente(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const existentes = new Set((representante?.clientes || []).map((c) => c.id))
      setClienteResults(Array.isArray(data) ? data.filter((c: any) => !existentes.has(c.id)) : [])
    } catch {} finally {
      setSearchingCliente(false)
    }
  }

  function addCliente(c: any) {
    if ((representante?.clientes || []).find((x) => x.id === c.id)) return
    setRepresentante((prev) => prev ? { ...prev, clientes: [...(prev.clientes || []), { id: c.id, nome: c.nome }] } : prev)
    setClienteResults([])
    setSearchCliente("")
  }

  function removeCliente(cid: number) {
    setRepresentante((prev) => prev ? { ...prev, clientes: (prev.clientes || []).filter((c) => c.id !== cid) } : prev)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!representante) return null

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/comercial/representantes"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Voltar para Representantes
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Editar Representante{info && <InfoButton content={info} />}</h1>
            <p className="text-sm text-slate-500">{representante.nome}</p>
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
                value={representante.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                CNPJ *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={representante.cnpj}
                  onChange={(e) => handleChange("cnpj", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleConsultarCnpj())}
                  className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleConsultarCnpj}
                  disabled={consulting}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/50 dark:hover:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {consulting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  <span className="hidden sm:inline">Consultar</span>
                </button>
              </div>
            </div>

            {consulted && !apiData && (
              <div className="md:col-span-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  CNPJ não encontrado na Receita Federal. Preencha os dados manualmente.
                </p>
              </div>
            )}
            {apiData && (
              <div className="md:col-span-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">{apiData.razao_social}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                    {apiData.nome_fantasia} — {apiData.situacao_cadastral}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Razão Social
              </label>
              <input
                type="text"
                value={representante.razaoSocial || ""}
                onChange={(e) => handleChange("razaoSocial", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={representante.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Telefone
              </label>
              <input
                type="text"
                value={representante.telefone || ""}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Contato
              </label>
              <input
                type="text"
                value={representante.contato || ""}
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
                value={representante.cidade || ""}
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
                value={representante.uf || ""}
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
                value={representante.endereco || ""}
                onChange={(e) => handleChange("endereco", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Gerente Responsável
              </label>
              <select
                value={representante.gerenteId ? String(representante.gerenteId) : ""}
                onChange={(e) => handleNumberChange("gerenteId", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="">Selecione o gerente (usuário do comercial)</option>
                {(gerentes || []).map((g) => (
                  <option key={g.id} value={String(g.id)}>{g.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">Usuários do setor comercial que serão gerentes</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ID Integração (ERP/WMS/CRM/OUTROS)
              </label>
              <input
                type="text"
                value={representante.idIntegracao || ""}
                onChange={(e) => handleChange("idIntegracao", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                placeholder="Código do sistema externo"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Clientes Vinculados ({(representante.clientes || []).length})
            </h2>

            {(representante.clientes || []).length > 0 && (
              <div className="space-y-2">
                {(representante.clientes || []).map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{c.nome}</span>
                    <button type="button" onClick={() => removeCliente(c.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchCliente}
                  onChange={(e) => searchClientes(e.target.value)}
                  placeholder="Buscar cliente pelo nome ou CNPJ..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchingCliente && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
              </div>
              {clienteResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg max-h-48 overflow-y-auto">
                  {clienteResults.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => addCliente(c)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                    >
                      <UserPlus size={14} className="text-slate-400" />
                      {c.nome}
                      {c.cnpj && <span className="text-slate-400 text-xs font-mono ml-auto">{c.cnpj}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <div />
            <div className="flex gap-2">
              <Link
                href="/comercial/representantes"
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
    </div>
  )
}
