"use client"

import { useState } from "react"
import { Search, Building2, Loader2, X, Check, ExternalLink, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BuscarCnpjModalProps {
  tipo: "pessoa" | "representante"
  onClose: () => void
  onCreated?: () => void
}

type ApiData = Record<string, any>

function formatCnpj(v: string) {
  const d = v.replace(/\D/g, "")
  if (d.length !== 14) return v
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export default function BuscarCnpjModal({ tipo, onClose, onCreated }: BuscarCnpjModalProps) {
  const [cnpj, setCnpj] = useState("")
  const [loading, setLoading] = useState(false)
  const [apiData, setApiData] = useState<ApiData | null>(null)
  const [existentes, setExistentes] = useState<{ crmPessoas: any[]; representantes: any[] }>({ crmPessoas: [], representantes: [] })
  const [creating, setCreating] = useState(false)
  const [consultado, setConsultado] = useState(false)

  const titulo = tipo === "pessoa" ? "Pessoa (Negócio)" : "Representante"

  async function handleConsultar() {
    const digits = cnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    setLoading(true)
    setApiData(null)
    setExistentes({ crmPessoas: [], representantes: [] })
    setConsultado(false)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      setApiData(result.apiData || null)
      setExistentes({
        crmPessoas: result.crmPessoas || [],
        representantes: result.representantes || [],
      })
      setConsultado(true)
      if (!result.apiData) {
        toast.error("CNPJ não encontrado na Receita Federal")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCriar() {
    if (!apiData) return
    setCreating(true)
    try {
      const api = apiData
      if (tipo === "pessoa") {
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
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Erro ao criar pessoa")
        }
        toast.success(`Pessoa "${body.razaoSocial}" criada com sucesso`)
      } else {
        const body = {
          nome: api.nome_fantasia || api.razao_social || "",
          cnpj: api.cnpj || "",
          razaoSocial: api.razao_social || "",
          endereco: [api.logradouro, api.numero, api.bairro, api.complemento].filter(Boolean).join(", "),
          cidade: api.municipio || "",
          uf: api.uf || "",
        }
        const res = await fetch("/api/representantes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Erro ao criar representante")
        }
        toast.success(`Representante "${body.nome}" criado com sucesso`)
      }
      onCreated?.()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const jaExiste = tipo === "pessoa"
    ? existentes.crmPessoas.length > 0
    : existentes.representantes.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Buscar CNPJ
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
              placeholder="Digite o CNPJ (com ou sem pontuação)"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              maxLength={18}
            />
            <Button onClick={handleConsultar} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Consultar
            </Button>
          </div>

          {consultado && !apiData && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">CNPJ não encontrado</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  O CNPJ {formatCnpj(cnpj)} não foi localizado na base da Receita Federal.
                </p>
              </div>
            </div>
          )}

          {apiData && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <div className="flex items-start gap-2">
                <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">
                    {apiData.razao_social}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {apiData.nome_fantasia} — {apiData.situacao_cadastral}
                  </p>
                </div>
              </div>
            </div>
          )}

          {apiData && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500">CNPJ</p>
                  <p className="text-slate-900 dark:text-slate-200 font-mono">{formatCnpj(apiData.cnpj)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Situação</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.situacao_cadastral}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Razão Social</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">{apiData.razao_social}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Nome Fantasia</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.nome_fantasia || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Porte</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.porte_empresa || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CNAE</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.cnae_principal_descricao || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Endereço</p>
                  <p className="text-slate-900 dark:text-slate-200">
                    {[apiData.logradouro, apiData.numero, apiData.bairro, apiData.complemento].filter(Boolean).join(", ") || "—"}
                    {apiData.cep && ` — CEP ${apiData.cep}`}
                    {apiData.municipio && ` — ${apiData.municipio}/${apiData.uf}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {jaExiste && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                {tipo === "pessoa" ? "Pessoa(s)" : "Representante(s)"} já cadastrado(s) com este CNPJ:
              </p>
              <div className="space-y-2">
                {(tipo === "pessoa" ? existentes.crmPessoas : existentes.representantes).map((item: any) => (
                  <Link
                    key={item.id}
                    href={tipo === "pessoa" ? `/comercial/crm/pessoas/${item.id}` : `/comercial/representantes/${item.id}`}
                    target="_blank"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    {item.razaoSocial || item.nome} <ExternalLink size={12} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {apiData && !jaExiste && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
              <Building2 size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-medium text-slate-900 dark:text-slate-200">
                Deseja criar {tipo === "pessoa" ? "uma nova Pessoa" : "um novo Representante"}?
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Os dados serão preenchidos automaticamente com as informações da Receita Federal.
              </p>
              <Button onClick={handleCriar} disabled={creating} className="gap-2">
                {creating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Building2 size={16} />
                )}
                {creating ? "Criando..." : `Criar ${titulo}`}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end p-5 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
