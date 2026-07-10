"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { PlusCircle, UserCircle, Search } from "lucide-react"

async function fetchEmpresas() {
  const res = await fetch("/api/crm/pessoas")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  QUALIFICADO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  CONVERTIDO_CLIENTE: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
  INATIVO: "text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500",
}

export default function CrmPessoasPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")

  const { data: empresas, isLoading } = useQuery({
    queryKey: ["crm-pessoas"],
    queryFn: fetchEmpresas,
    retry: 1,
  })

  const filtered = (empresas || []).filter((e: any) =>
    !search || e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.razaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
    e.cpf?.includes(search) ||
    e.cnpj?.includes(search)
  )

  function nomeExibicao(p: any) {
    if (p.tipoPessoa === "PF") return p.nome || "—"
    return p.razaoSocial || "—"
  }

  function documento(p: any) {
    if (p.tipoPessoa === "PF") return p.cpf || "—"
    return p.cnpj || "—"
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Pessoas{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtered.length} pessoa(s)`}
          </p>
        </div>
        <Link
          href="/comercial/crm/pessoas/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Nova Pessoa
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou CNPJ..."
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
            <UserCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma pessoa encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Documento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Segmento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Responsável</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((emp: any) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => router.push(`/comercial/crm/pessoas/${emp.id}`)}
                  >
                    <td className="px-4 py-3">
                      {emp.tipoPessoa ? (
                        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          emp.tipoPessoa === "PF"
                            ? "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400"
                            : "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400"
                        }`}>
                          {emp.tipoPessoa === "PF" ? "PF" : "PJ"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-200">{nomeExibicao(emp)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{documento(emp)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{emp.segmento || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{emp.responsavelNome || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[emp.status] || "text-slate-600 bg-slate-100"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString("pt-BR") : "—"}
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
