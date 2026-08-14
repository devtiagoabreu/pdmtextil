"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, Search, Loader2, CheckCircle2, AlertCircle, Trash2, Users, UserPlus } from "lucide-react"
import { toast } from "sonner"

type ClienteVinculado = { id: number; nome: string }

export default function NovoRepresentantePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consulting, setConsulting] = useState(false)
  const [consulted, setConsulted] = useState(false)
  const [apiData, setApiData] = useState<any>(null)
  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    razaoSocial: "",
    email: "",
    telefone: "",
    contato: "",
    endereco: "",
    cidade: "",
    uf: "",
    gerenteId: "",
    idIntegracao: "",
  })
  const [clientesVinculados, setClientesVinculados] = useState<ClienteVinculado[]>([])
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function formatCnpj(v: string) {
    const d = v.replace(/\D/g, "")
    if (d.length !== 14) return v
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  }

  async function handleConsultarCnpj() {
    const digits = (form.cnpj || "").replace(/\D/g, "")
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
      setForm((prev) => ({
        ...prev,
        cnpj: formatCnpj(digits),
        razaoSocial: api.razao_social || prev.razaoSocial,
        endereco: api.logradouro || prev.endereco,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
      }))
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
      const existentes = new Set(clientesVinculados.map((c) => c.id))
      setClienteResults(Array.isArray(data) ? data.filter((c: any) => !existentes.has(c.id)) : [])
    } catch {} finally {
      setSearchingCliente(false)
    }
  }

  function addCliente(c: any) {
    if (clientesVinculados.find((x) => x.id === c.id)) return
    setClientesVinculados((prev) => [...prev, { id: c.id, nome: c.nome }])
    setClienteResults([])
    setSearchCliente("")
  }

  function removeCliente(id: number) {
    setClientesVinculados((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error("Nome fantasia é obrigatório")
      return
    }
    if (!form.cnpj.trim()) {
      toast.error("CNPJ é obrigatório")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        gerenteId: form.gerenteId ? parseInt(form.gerenteId) : null,
        clientesIds: clientesVinculados.map((c) => c.id),
      }
      const res = await fetch("/api/representantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao cadastrar")
      }

      toast.success("Representante cadastrado com sucesso!")
      router.push("/comercial/representantes")
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar representante")
    } finally {
      setIsSubmitting(false)
    }
  }

  const estados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/comercial/representantes" className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Novo Representante{info && <InfoButton content={info} />}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Cadastre um novo representante comercial no sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Dados Principais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome Fantasia <span className="text-red-500">*</span>
                </label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Representações ABC"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleConsultarCnpj())}
                    placeholder="00.000.000/0001-00"
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleConsultarCnpj}
                    disabled={consulting}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/50 dark:hover:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {consulting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    <span className="hidden sm:inline">Consultar</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razão Social</label>
                <input type="text" name="razaoSocial" value={form.razaoSocial} onChange={handleChange} placeholder="Razão social completa"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-semibold mb-4">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Contato</label>
                <input type="text" name="contato" value={form.contato} onChange={handleChange} placeholder="Pessoa de contato"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="contato@representante.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                <input type="text" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 3333-4444"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-semibold mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
                <input type="text" name="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua, número, complemento"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                <input type="text" name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
                <select name="uf" value={form.uf} onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione</option>
                  {estados.map((e: any) => (<option key={e} value={e}>{e}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-semibold mb-4">Gestão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gerente Responsável</label>
                <select name="gerenteId" value={form.gerenteId} onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione o gerente (usuário do comercial)</option>
                  {(gerentes || []).map((g) => (
                    <option key={g.id} value={String(g.id)}>{g.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Usuários do setor comercial que serão gerentes</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Clientes Vinculados ({clientesVinculados.length})
            </h2>

            {clientesVinculados.length > 0 && (
              <div className="mb-3 space-y-2">
                {clientesVinculados.map((c) => (
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

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-semibold mb-4">Integração</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Integração (ERP/WMS/CRM/OUTROS)</label>
                <input type="text" name="idIntegracao" value={form.idIntegracao} onChange={handleChange} placeholder="Código do sistema externo"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="submit" disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? "Salvando..." : "Salvar Representante"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
