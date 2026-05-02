"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, Clock, User, Building2, Calendar, FileText, Send } from "lucide-react"
import { toast } from "sonner"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  PENDENTE:       { label: "Pendente",       classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  EM_ANALISE:     { label: "Em Análise",     classes: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  AGUARDANDO_INFO:{ label: "Aguard. Info",   classes: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  CONCLUIDO:      { label: "Concluído",      classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

const TIPO_CONFIG: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM:      "Desenvolvimento Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Desenvolvimento Beneficiamento",
}

async function fetchSolicitacao(id: string) {
  const res = await fetch(`/api/solicitacoes/${id}`)
  if (!res.ok) throw new Error("Falha ao carregar solicitação")
  return res.json()
}

export default function DetalheSolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const { data: sol, isLoading, error } = useQuery({
    queryKey: ["solicitacao", id],
    queryFn: () => fetchSolicitacao(id),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !sol) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Erro ao carregar solicitação</p>
        <Link href="/comercial/solicitacoes" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar à lista
        </Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[sol.status] ?? { label: sol.status, classes: "bg-slate-100 text-slate-600" }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/solicitacoes"
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            #{sol.id} - {sol.cliente}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{sol.projeto || "Sem projeto"}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusCfg.classes}`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} />
              Dados Comerciais
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Tipo</p>
                <p className="font-medium">{TIPO_CONFIG[sol.tipo] || sol.tipo}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">CNPJ</p>
                <p className="font-medium">{sol.cnpj || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Prazo Desejado</p>
                <p className="font-medium">
                  {sol.prazoDesejado ? new Date(sol.prazoDesejado).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Criado em</p>
                <p className="font-medium">
                  {sol.createdAt ? new Date(sol.createdAt).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
            </div>
          </div>

          {sol.briefing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-lg font-semibold mb-4">Briefing</h2>
              <pre className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(sol.briefing, null, 2)}
              </pre>
            </div>
          )}

          {sol.anexos && sol.anexos.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-lg font-semibold mb-4">Anexos</h2>
              <ul className="space-y-2">
                {sol.anexos.map((a: any) => (
                  <li key={a.id}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      {a.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock size={20} />
              Histórico
            </h2>
            {sol.historicoComunicacao && sol.historicoComunicacao.length > 0 ? (
              <div className="space-y-4">
                {sol.historicoComunicacao.map((h: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                    <p className="text-sm font-medium">{h.mensagem || h.acao}</p>
                    <p className="text-xs text-slate-500">
                      {h.usuario} - {new Date(h.data).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sem histórico</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Solicitante
            </h2>
            <p className="font-medium">{sol.solicitanteNome || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}