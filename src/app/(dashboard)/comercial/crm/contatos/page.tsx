"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import {
  PlusCircle, Search, Users,
  Star, StarOff, Phone, Mail,
  Building2, User,
} from "lucide-react"
import { Button } from "@/components/ui/button"

async function fetchContatos() {
  const res = await fetch("/api/crm/contatos")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

export default function CrmContatosPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")

  const { data: contatos, isLoading } = useQuery({
    queryKey: ["crm-contatos"],
    queryFn: fetchContatos,
    retry: 1,
  })

  const filtered = (contatos || []).filter((c: any) =>
    !search ||
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.empresaRazaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
    c.empresaNomeFantasia?.toLowerCase().includes(search.toLowerCase()) ||
    c.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  function empresaNome(c: any) {
    return c.empresaRazaoSocial || c.empresaNomeFantasia || c.empresaNome || "—"
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Contatos{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtered.length} contato(s)`}
          </p>
        </div>
        <Link
          href="/comercial/crm/contatos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Novo Contato
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, empresa ou cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum contato encontrado</p>
            <Link href="/comercial/crm/contatos/novo" className="text-sm text-blue-600 hover:underline mt-1">
              Cadastrar primeiro contato
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Principal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cargo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Celular</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => router.push(`/comercial/crm/contatos/${c.id}`)}
                  >
                    <td className="px-4 py-3">
                      {c.principal ? (
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                      ) : (
                        <StarOff size={14} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">{c.nome}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.cargo || "—"}</td>
                    <td className="px-4 py-3">
                      {c.empresaId ? (
                        <Link
                          href={`/comercial/crm/pessoas/${c.empresaId}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Building2 size={12} />
                          {empresaNome(c)}
                        </Link>
                      ) : c.clienteId ? (
                        <Link
                          href={`/comercial/crm/clientes/${c.clienteId}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                        >
                          <User size={12} />
                          {c.clienteNome || "—"}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {c.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" />
                          {c.email}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {c.celular ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {c.celular}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "—"}
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
