"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Search, Building2, RefreshCw, Check, X, AlertCircle, ExternalLink, PlusCircle, UserPlus } from "lucide-react"
import { toast } from "sonner"

type FieldMap = { field: string; label: string; apiKey: string; localKey: string; format?: (v: any) => string }

const PESSOA_FIELDS: FieldMap[] = [
  { field: "razaoSocial", label: "Razão Social", apiKey: "razao_social", localKey: "razaoSocial" },
  { field: "nomeFantasia", label: "Nome Fantasia", apiKey: "nome_fantasia", localKey: "nomeFantasia" },
  { field: "endereco", label: "Logradouro", apiKey: "logradouro", localKey: "endereco" },
  { field: "numero", label: "Número", apiKey: "numero", localKey: "numero" },
  { field: "complemento", label: "Complemento", apiKey: "complemento", localKey: "complemento" },
  { field: "bairro", label: "Bairro", apiKey: "bairro", localKey: "bairro" },
  { field: "cidade", label: "Cidade", apiKey: "municipio", localKey: "cidade" },
  { field: "uf", label: "UF", apiKey: "uf", localKey: "uf" },
  { field: "cep", label: "CEP", apiKey: "cep", localKey: "cep" },
  { field: "segmento", label: "Segmento", apiKey: "cnae_principal_descricao", localKey: "segmento" },
  { field: "porte", label: "Porte", apiKey: "porte_empresa", localKey: "porte" },
]

const CLIENTE_FIELDS: FieldMap[] = [
  { field: "razaoSocial", label: "Razão Social", apiKey: "razao_social", localKey: "razaoSocial" },
  { field: "nome", label: "Nome Fantasia", apiKey: "nome_fantasia", localKey: "nome" },
  {
    field: "endereco",
    label: "Endereço",
    apiKey: "logradouro",
    localKey: "endereco",
    format: (api: any) => [api.logradouro, api.numero, api.bairro, api.complemento].filter(Boolean).join(", "),
  },
  { field: "cidade", label: "Cidade", apiKey: "municipio", localKey: "cidade" },
  { field: "uf", label: "UF", apiKey: "uf", localKey: "uf" },
]

function formatCnpj(v: string) {
  const d = v.replace(/\D/g, "")
  if (d.length !== 14) return v
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function getApiValue(apiData: any, field: FieldMap) {
  if (field.format) return field.format(apiData)
  return apiData?.[field.apiKey] || ""
}

function getLocalValue(local: any, field: FieldMap) {
  return local?.[field.localKey] || ""
}

function valDiffers(api: string, local: string) {
  return api && local && api.toLowerCase() !== local.toLowerCase()
}

export default function ConsultaCnpjPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [cnpj, setCnpj] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = cnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      setResult(await res.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function syncPessoa(pessoa: any) {
    if (!result?.apiData) return
    setSyncing(`pessoa-${pessoa.id}`)
    try {
      const api = result.apiData
      const body: Record<string, any> = {
        tipoPessoa: "PJ",
        razaoSocial: api.razao_social || pessoa.razaoSocial,
        nomeFantasia: api.nome_fantasia || pessoa.nomeFantasia,
        cnpj: api.cnpj || pessoa.cnpj,
        endereco: api.logradouro || pessoa.endereco,
        numero: api.numero || pessoa.numero,
        complemento: api.complemento || pessoa.complemento,
        bairro: api.bairro || pessoa.bairro,
        cidade: api.municipio || pessoa.cidade,
        uf: api.uf || pessoa.uf,
        cep: api.cep || pessoa.cep,
        segmento: api.cnae_principal_descricao || pessoa.segmento,
        porte: api.porte_empresa || pessoa.porte,
      }
      const res = await fetch(`/api/crm/pessoas/${pessoa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao sincronizar")
      toast.success("Pessoa CRM atualizada com dados da Receita")
      const refresh = await fetch(`/api/crm/consulta-cnpj?cnpj=${api.cnpj}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSyncing(null)
    }
  }

  async function syncCliente(cliente: any) {
    if (!result?.apiData) return
    setSyncing(`cliente-${cliente.id}`)
    try {
      const api = result.apiData
      const body: Record<string, any> = {
        nome: api.nome_fantasia || cliente.nome,
        cnpj: api.cnpj || cliente.cnpj,
        razaoSocial: api.razao_social || cliente.razaoSocial,
        endereco: [api.logradouro, api.numero, api.bairro, api.complemento].filter(Boolean).join(", ") || cliente.endereco,
        cidade: api.municipio || cliente.cidade,
        uf: api.uf || cliente.uf,
      }
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao sincronizar")
      toast.success("Cliente atualizado com dados da Receita")
      const refresh = await fetch(`/api/crm/consulta-cnpj?cnpj=${api.cnpj}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSyncing(null)
    }
  }

  async function criarPessoa() {
    if (!result?.apiData) return
    setCreating("pessoa")
    try {
      const api = result.apiData
      const body = {
        tipoPessoa: "PJ",
        razaoSocial: api.razao_social || "",
        nomeFantasia: api.nome_fantasia || "",
        cnpj: api.cnpj || "",
        endereco: api.logradouro || "",
        numero: api.numero || "",
        complemento: api.complemento || "",
        bairro: api.bairro || "",
        cidade: api.municipio || "",
        uf: api.uf || "",
        cep: api.cep || "",
        segmento: api.cnae_principal_descricao || "",
        porte: api.porte_empresa || "",
      }
      const res = await fetch("/api/crm/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao criar pessoa")
      const nova = await res.json()
      toast.success(`Pessoa CRM "${body.razaoSocial}" criada com sucesso`)
      const refresh = await fetch(`/api/crm/consulta-cnpj?cnpj=${api.cnpj}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(null)
    }
  }

  async function criarCliente() {
    if (!result?.apiData) return
    setCreating("cliente")
    try {
      const api = result.apiData
      const body = {
        nome: api.nome_fantasia || api.razao_social || "",
        cnpj: api.cnpj || "",
        razaoSocial: api.razao_social || "",
        endereco: [api.logradouro, api.numero, api.bairro, api.complemento].filter(Boolean).join(", "),
        cidade: api.municipio || "",
        uf: api.uf || "",
      }
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao criar cliente")
      const novo = await res.json()
      toast.success(`Cliente "${body.nome}" criado com sucesso`)
      const refresh = await fetch(`/api/crm/consulta-cnpj?cnpj=${api.cnpj}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(null)
    }
  }

  const apiData = result?.apiData

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/ferramentas" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div className="flex items-center gap-2">
          <Building2 className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Consulta CNPJ{info && <InfoButton content={info} />}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          placeholder="Digite o CNPJ (com ou sem pontuação)"
          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          maxLength={18}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Search size={16} />
          )}
          {loading ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {result && !apiData && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">CNPJ não encontrado na Receita Federal</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              O CNPJ {formatCnpj(cnpj)} não foi localizado na base de dados da Receita Federal do Brasil.
            </p>
          </div>
        </div>
      )}

      {apiData && (
        <>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-start gap-3">
            <Check size={20} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                {apiData.razao_social}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                {apiData.nome_fantasia} &mdash; {apiData.situacao_cadastral} &mdash; {apiData.matriz_filial}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">Dados da Receita Federal</h2>
              <p className="text-xs text-slate-400 mb-4">Fonte: OpenCNPJ (api.opencnpj.org)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">CNPJ</p>
                  <p className="text-slate-900 dark:text-slate-200 font-mono">{formatCnpj(apiData.cnpj)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Situação</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.situacao_cadastral}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Abertura</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.data_inicio_atividade || "—"}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-slate-500 mb-0.5">Razão Social</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">{apiData.razao_social}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-slate-500 mb-0.5">Nome Fantasia</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.nome_fantasia || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Porte</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.porte_empresa || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Natureza Jurídica</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.natureza_juridica || "—"}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-slate-500 mb-0.5">CNAE Principal</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.cnae_principal} — {apiData.cnae_principal_descricao || "—"}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-slate-500 mb-0.5">Endereço</p>
                  <p className="text-slate-900 dark:text-slate-200">
                    {[apiData.logradouro, apiData.numero, apiData.bairro, apiData.complemento].filter(Boolean).join(", ") || "—"}
                    {apiData.cep && ` — CEP ${apiData.cep}`}
                    {apiData.municipio && ` — ${apiData.municipio}/${apiData.uf}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Capital Social</p>
                  <p className="text-slate-900 dark:text-slate-200">
                    {apiData.capital_social
                      ? `R$ ${parseFloat(apiData.capital_social.replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Simples Nacional</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.opcao_simples === "S" ? "Optante" : apiData.opcao_simples === "N" ? "Não optante" : "—"}</p>
                </div>
                {apiData.email && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">E-mail</p>
                    <p className="text-slate-900 dark:text-slate-200">{apiData.email}</p>
                  </div>
                )}
              </div>
            </div>

            {result.crmPessoas?.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  CRM Pessoas ({result.crmPessoas.length} encontrada(s))
                </h2>
                {result.crmPessoas.map((pessoa: any) => (
                  <div key={pessoa.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Link href={`/comercial/crm/pessoas/${pessoa.id}`} className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                        {pessoa.razaoSocial || pessoa.nome} <ExternalLink size={12} />
                      </Link>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        {pessoa.status}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">Campo</th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">Atual</th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5">API</th>
                          </tr>
                        </thead>
                        <tbody>
                          {PESSOA_FIELDS.map((f) => {
                            const api = getApiValue(apiData, f)
                            const local = getLocalValue(pessoa, f)
                            const diff = valDiffers(api, local)
                            return (
                              <tr key={f.field} className={`border-b border-slate-50 dark:border-slate-800/50 ${diff ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                                <td className="py-1.5 pr-3 text-xs text-slate-500 whitespace-nowrap">{f.label}</td>
                                <td className={`py-1.5 pr-3 ${local ? "text-slate-900 dark:text-slate-200" : "text-slate-400 italic"}`}>
                                  {local || "vazio"}
                                </td>
                                <td className={`py-1.5 ${diff ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-300"}`}>
                                  {api || "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => syncPessoa(pessoa)}
                        disabled={syncing === `pessoa-${pessoa.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw size={13} className={syncing === `pessoa-${pessoa.id}` ? "animate-spin" : ""} />
                        {syncing === `pessoa-${pessoa.id}` ? "Sincronizando..." : "Sincronizar dados com a Receita"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.clientes?.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Clientes ({result.clientes.length} encontrado(s))
                </h2>
                {result.clientes.map((cliente: any) => (
                  <div key={cliente.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {cliente.nome}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        ID {cliente.id}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">Campo</th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">Atual</th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5">API</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CLIENTE_FIELDS.map((f) => {
                            const api = getApiValue(apiData, f)
                            const local = getLocalValue(cliente, f)
                            const diff = valDiffers(api, local)
                            return (
                              <tr key={f.field} className={`border-b border-slate-50 dark:border-slate-800/50 ${diff ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                                <td className="py-1.5 pr-3 text-xs text-slate-500 whitespace-nowrap">{f.label}</td>
                                <td className={`py-1.5 pr-3 ${local ? "text-slate-900 dark:text-slate-200" : "text-slate-400 italic"}`}>
                                  {local || "vazio"}
                                </td>
                                <td className={`py-1.5 ${diff ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-300"}`}>
                                  {api || "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => syncCliente(cliente)}
                        disabled={syncing === `cliente-${cliente.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw size={13} className={syncing === `cliente-${cliente.id}` ? "animate-spin" : ""} />
                        {syncing === `cliente-${cliente.id}` ? "Sincronizando..." : "Sincronizar dados com a Receita"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!result.crmPessoas?.length && !result.clientes?.length) && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <Building2 size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="font-medium text-slate-900 dark:text-slate-200">Nenhum registro local encontrado</p>
                <p className="text-sm text-slate-500 mt-1">
                  Este CNPJ não está cadastrado. Deseja cadastrar?
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={criarPessoa}
                    disabled={creating !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {creating === "pessoa" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Building2 size={15} />
                    )}
                    {creating === "pessoa" ? "Criando..." : "Cadastrar como Pessoa CRM"}
                  </button>
                  <button
                    onClick={criarCliente}
                    disabled={creating !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {creating === "cliente" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    {creating === "cliente" ? "Criando..." : "Cadastrar como Cliente"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
