"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, Search, Building2, Phone, Mail, MapPin, Pencil, Users, Database, FileText, FlaskConical, Loader2, X, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import ImportarApiModal from "@/components/integracao/ImportarApiModal"
import { ExportarDados } from "@/components/exportar/ExportarDados"

type Cliente = {
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
  ativo: boolean
}

type SolicitacaoResumo = {
  id: number
  tipo: string
  status: string
  cliente: string
  projeto: string | null
  prazoDesejado: string | null
  createdAt: string
  solicitanteNome: string | null
}

type AmostraResumo = {
  id: number
  tipoAmostra: string
  descricao: string | null
  status: string
  produtoCodigo: string
  produtoDescricao: string
  acabamentoDescricao?: string | null
}

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  AGUARDANDO_INFO: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  AGUARDANDO_MATERIA_PRIMA: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  EM_DESENVOLVIMENTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  APROVADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  REPROVADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  EM_PRODUCAO: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  CONCLUIDO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

const AMOSTRA_STATUS_BADGE: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  APROVADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  REPROVADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

export default function ClientesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showApiImport, setShowApiImport] = useState(false)

  const [solicModal, setSolicModal] = useState<{ cliente: Cliente; data: SolicitacaoResumo[]; loading: boolean } | null>(null)
  const [amostraModal, setAmostraModal] = useState<{ cliente: Cliente; data: AmostraResumo[]; loading: boolean } | null>(null)

  useEffect(() => {
    async function fetchClientes() {
      try {
        const res = await fetch("/api/clientes")
        if (res.ok) {
          const data = await res.json()
          setClientes(data)
        }
      } catch (err) {
        console.error("Erro ao buscar clientes:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchClientes()
  }, [])

  async function abrirSolicitacoes(cliente: Cliente) {
    setSolicModal({ cliente, data: [], loading: true })
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/solicitacoes`)
      if (res.ok) {
        const data = await res.json()
        setSolicModal({ cliente, data, loading: false })
      } else {
        setSolicModal(null)
        toast.error("Erro ao carregar solicitações")
      }
    } catch {
      setSolicModal(null)
      toast.error("Erro ao carregar solicitações")
    }
  }

  async function abrirAmostras(cliente: Cliente) {
    setAmostraModal({ cliente, data: [], loading: true })
    try {
      const res = await fetch(`/api/clientes/${cliente.id}/amostras`)
      if (res.ok) {
        const json = await res.json()
        const todas: AmostraResumo[] = [
          ...(json.tecidoCru || []),
          ...(json.acabamento || []),
        ]
        setAmostraModal({ cliente, data: todas, loading: false })
      } else {
        setAmostraModal(null)
        toast.error("Erro ao carregar amostras")
      }
    } catch {
      setAmostraModal(null)
      toast.error("Erro ao carregar amostras")
    }
  }

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search) ||
    c.razaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Clientes{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? "Carregando..." : `${filtered.length} cliente${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportarDados data={filtered} columns={[
            { key: "nome", label: "Nome" }, { key: "cnpj", label: "CNPJ" }, { key: "email", label: "Email" },
            { key: "telefone", label: "Telefone" }, { key: "cidade", label: "Cidade" }, { key: "uf", label: "UF" },
          ]} filename="clientes-comercial" title="Clientes" />
          <Button variant="outline" onClick={() => setShowApiImport(true)} className="gap-2">
            <Database size={16} />
            Importar via API
          </Button>
          <Link
          href="/comercial/clientes/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Novo Cliente
        </Link>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ, razão social ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-2">Carregando clientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{cliente.nome}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.razaoSocial}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {cliente.cnpj}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {cliente.contato && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users size={14} className="text-slate-400" />
                      <span>{cliente.contato}</span>
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone size={14} className="text-slate-400" />
                      <span>{cliente.telefone}</span>
                    </div>
                  )}
                  {cliente.cidade && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{cliente.cidade}{cliente.uf ? `, ${cliente.uf}` : ""}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Link
                    href={`/comercial/clientes/${cliente.id}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Pencil size={12} />
                    Editar
                  </Link>
                  <button
                    onClick={() => abrirSolicitacoes(cliente)}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                  >
                    <FileText size={12} />
                    Solicitações
                  </button>
                  <button
                    onClick={() => abrirAmostras(cliente)}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
                  >
                    <FlaskConical size={12} />
                    Amostras
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {solicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSolicModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={18} className="text-emerald-500" />
                Solicitações — {solicModal.cliente.nome}
              </h2>
              <button onClick={() => setSolicModal(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {solicModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : solicModal.data.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-12">Nenhuma solicitação encontrada</p>
              ) : (
                <div className="space-y-2">
                  {solicModal.data.map(s => (
                    <Link
                      key={s.id}
                      href={`/comercial/solicitacoes/${s.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">#{s.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status] || "bg-slate-100 text-slate-600"}`}>
                            {s.status}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                            {s.tipo === "DESENVOLVIMENTO_TECELAGEM" ? "TECELAGEM" : "BENEFICIAMENTO"}
                          </span>
                        </div>
                        {s.projeto && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{s.projeto}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : ""}
                          {s.solicitanteNome ? ` • ${s.solicitanteNome}` : ""}
                        </p>
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {amostraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAmostraModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FlaskConical size={18} className="text-purple-500" />
                Amostras — {amostraModal.cliente.nome}
              </h2>
              <button onClick={() => setAmostraModal(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {amostraModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : amostraModal.data.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-12">Nenhuma amostra encontrada</p>
              ) : (
                <div className="space-y-2">
                  {amostraModal.data.map(a => (
                    <Link
                      key={`${a.tipoAmostra}-${a.id}`}
                      href={`/amostras?focoAmostra=${a.id}&tipo=${a.tipoAmostra}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">{a.produtoCodigo}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${AMOSTRA_STATUS_BADGE[a.status] || "bg-slate-100 text-slate-600"}`}>
                            {a.status}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 uppercase">
                            {a.tipoAmostra === "TECIDO_CRU" ? "CRU" : "ACABAMENTO"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{a.descricao || a.produtoDescricao}</p>
                        {a.acabamentoDescricao && (
                          <p className="text-xs text-slate-400 mt-0.5">Acabamento: {a.acabamentoDescricao}</p>
                        )}
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showApiImport && (
        <ImportarApiModal
          tela="clientes"
          existingRecords={clientes}
          existingKey="idIntegracao"
          onImportado={() => window.location.reload()}
          onClose={() => setShowApiImport(false)}
        />
      )}
    </div>
  )
}