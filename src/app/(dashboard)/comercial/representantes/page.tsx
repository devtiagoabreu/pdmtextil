"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, Search, Building2, Phone, Mail, MapPin, Pencil, Users, Database, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import ImportarApiModal from "@/components/integracao/ImportarApiModal"
import BuscarCnpjModal from "@/components/crm/buscar-cnpj-modal"
import { ExportarDados } from "@/components/exportar/ExportarDados"

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
  ativo: boolean
}

export default function RepresentantesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [representantes, setRepresentantes] = useState<Representante[]>([])
  const [loading, setLoading] = useState(true)
  const [showApiImport, setShowApiImport] = useState(false)
  const [showCnpjSearch, setShowCnpjSearch] = useState(false)

  useEffect(() => {
    async function fetchRepresentantes() {
      try {
        const res = await fetch("/api/representantes")
        if (res.ok) {
          const data = await res.json()
          setRepresentantes(data)
        }
      } catch (err) {
        console.error("Erro ao buscar representantes:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRepresentantes()
  }, [])

  const filtered = representantes.filter((r) =>
    r.nome.toLowerCase().includes(search.toLowerCase()) ||
    r.cnpj.includes(search) ||
    r.razaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
    r.cidade?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Representantes{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? "Carregando..." : `${filtered.length} representante${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportarDados data={filtered} columns={[
            { key: "nome", label: "Nome" }, { key: "cnpj", label: "CNPJ" }, { key: "email", label: "Email" },
            { key: "telefone", label: "Telefone" }, { key: "cidade", label: "Cidade" }, { key: "uf", label: "UF" },
          ]} filename="representantes" title="Representantes" />
          <Button variant="outline" onClick={() => setShowCnpjSearch(true)} className="gap-2">
            <Building2 size={16} />
            Buscar CNPJ
          </Button>
          <Button variant="outline" onClick={() => setShowApiImport(true)} className="gap-2">
            <Database size={16} />
            Importar via API
          </Button>
          <Link
            href="/comercial/representantes/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Novo Representante
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
            <p className="text-sm text-slate-500 mt-2">Carregando representantes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum representante encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{r.nome}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.razaoSocial}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {r.cnpj}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {r.contato && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users size={14} className="text-slate-400" />
                      <span>{r.contato}</span>
                    </div>
                  )}
                  {r.email && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{r.email}</span>
                    </div>
                  )}
                  {r.telefone && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone size={14} className="text-slate-400" />
                      <span>{r.telefone}</span>
                    </div>
                  )}
                  {r.cidade && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{r.cidade}{r.uf ? `, ${r.uf}` : ""}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Link
                    href={`/comercial/representantes/${r.id}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Pencil size={12} />
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showApiImport && (
        <ImportarApiModal
          tela="representantes"
          existingRecords={representantes}
          existingKey="idIntegracao"
          onImportado={() => window.location.reload()}
          onClose={() => setShowApiImport(false)}
        />
      )}

      {showCnpjSearch && (
        <BuscarCnpjModal
          tipo="representante"
          onCreated={() => window.location.reload()}
          onClose={() => setShowCnpjSearch(false)}
        />
      )}
    </div>
  )
}
