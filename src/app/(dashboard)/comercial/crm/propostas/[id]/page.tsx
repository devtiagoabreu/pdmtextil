"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useParams, useRouter, usePathname } from "next/navigation"
import { ArrowLeft, ExternalLink, CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react"
import Link from "next/link"

async function fetchProposta(id: string) {
  const res = await fetch(`/api/crm/propostas/${id}`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const STATUS_OPCOES = [
  { value: "ENVIADA", label: "Enviada", cor: "text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400" },
  { value: "REVISAO", label: "Em Revisão", cor: "text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400" },
  { value: "ACEITA", label: "Aceita", cor: "text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400" },
  { value: "RECUSADA", label: "Recusada", cor: "text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400" },
]

export default function DetalhePropostaPage() {
  const params = useParams()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: proposta, isLoading } = useQuery({
    queryKey: ["crm-proposta", id],
    queryFn: () => fetchProposta(id),
    retry: 1,
  })

  const statusMutation = useMutation({
    mutationFn: async (novoStatus: string) => {
      const res = await fetch(`/api/crm/propostas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) throw new Error("Falha ao atualizar status")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-proposta", id] })
      queryClient.invalidateQueries({ queryKey: ["crm-propostas"] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Proposta não encontrada</p>
        <Link href="/comercial/crm/propostas" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Voltar para propostas
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/comercial/crm/propostas")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{proposta.titulo}{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Proposta #{proposta.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Informações</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Pessoa (Negócio)</span>
                <span className="text-slate-900 dark:text-slate-200 font-medium">{proposta.empresaId || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Oportunidade</span>
                <span className="text-slate-900 dark:text-slate-200">{proposta.oportunidadeId || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Valor</span>
                <span className="text-slate-900 dark:text-slate-200 font-semibold">
                  {proposta.valor ? `R$ ${Number(proposta.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Prazo de Entrega</span>
                <span className="text-slate-900 dark:text-slate-200">{proposta.prazoEntrega || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Condições de Pagamento</span>
                <span className="text-slate-900 dark:text-slate-200">{proposta.condicoesPagamento || "—"}</span>
              </div>
              {proposta.descricao && (
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Descrição</span>
                  <p className="text-slate-900 dark:text-slate-200 mt-1 whitespace-pre-wrap text-sm">{proposta.descricao}</p>
                </div>
              )}
            </div>

            {proposta.arquivoUrl && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={proposta.arquivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  <ExternalLink size={16} />
                  Ver PDF da Proposta
                </a>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Timeline</h2>
            <div className="space-y-3">
              {proposta.dataEnvio && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500">Enviada em {new Date(proposta.dataEnvio).toLocaleString("pt-BR")}</span>
                </div>
              )}
              {proposta.dataResposta && (
                <div className="flex items-center gap-3 text-sm">
                  <RefreshCw size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500">Respondida em {new Date(proposta.dataResposta).toLocaleString("pt-BR")}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-500">Criada em {new Date(proposta.createdAt).toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">Status</h2>
            <span
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${
                STATUS_OPCOES.find((s) => s.value === proposta.status)?.cor || ""
              }`}
            >
              {proposta.status === "ACEITA" ? <CheckCircle2 size={14} /> :
               proposta.status === "RECUSADA" ? <XCircle size={14} /> :
               proposta.status === "REVISAO" ? <RefreshCw size={14} /> :
               <Clock size={14} />}
              {STATUS_OPCOES.find((s) => s.value === proposta.status)?.label || proposta.status}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">Alterar Status</h2>
            <div className="space-y-2">
              {STATUS_OPCOES.map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => statusMutation.mutate(opcao.value)}
                  disabled={opcao.value === proposta.status || statusMutation.isPending}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    opcao.value === proposta.status
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${opcao.cor.split(" ")[0]}`} />
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
