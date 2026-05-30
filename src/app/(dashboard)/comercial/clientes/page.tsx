"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, Search, Building2, Phone, Mail, MapPin, Pencil, Users, Database } from "lucide-react"
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

export default function ClientesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showApiImport, setShowApiImport] = useState(false)

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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {showApiImport && (
      <ImportarApiModal
        tela="clientes"
        existingRecords={clientes}
        existingKey="idIntegracao"
        onImportado={() => window.location.reload()}
        onClose={() => setShowApiImport(false)}
      />
    )}
  )
}