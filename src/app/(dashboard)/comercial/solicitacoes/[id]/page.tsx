"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Pencil, Trash2 } from "lucide-react"
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

export default function DetalheSolicitacaoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState<any>({})
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: sol, isLoading, error } = useQuery({
    queryKey: ["solicitacao", id],
    queryFn: () => fetchSolicitacao(id),
    enabled: mounted && !!id,
  })

  const deleteMutate = useMutation({
    mutationFn: () => fetch(`/api/solicitacoes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Solicitação excluída")
      router.push("/comercial/solicitacoes")
    },
    onError: () => toast.error("Erro ao excluir"),
  })

  useEffect(() => {
    if (sol) setForm(sol)
  }, [sol])

  if (!mounted) {
    return null
  }

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
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
          <Link
            href={`/comercial/solicitacoes/${id}/editar`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Pencil size={14} />
            Editar
          </Link>
          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir esta solicitação?")) {
                deleteMutate.mutate()
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
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
                <p className="text-slate-500 dark:text-slate-400">Cliente</p>
                <p className="font-medium">{sol.cliente || "—"}</p>
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
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
        </div>
      </div>
    </div>
  )
}