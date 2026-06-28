"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, Clock, User, FileText, Package, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"
import { gerarRequisicaoAmostraComercialPdf } from "@/lib/gerar-requisicao-amostra-comercial-pdf"

export default function DetalheRequisicaoAmostraComercialPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const id = params.id as string
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const { getLabel, getColor } = useStatuses("AMOSTRA_COMERCIAL")

  const handleGerarPdf = useCallback(async () => {
    setGerandoPdf(true)
    await gerarRequisicaoAmostraComercialPdf(id)
    setGerandoPdf(false)
  }, [id])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !id) return
    fetch(`/api/requisicoes-amostra-comercial/${id}?t=${Date.now()}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(d => setData(d))
      .catch(() => toast.error("Erro ao carregar requisição"))
      .finally(() => setLoading(false))
  }, [mounted, id])

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-2">Erro ao carregar requisição</p>
        <Link href="/comercial/requisicoes-amostra-comercial" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar à lista
        </Link>
      </div>
    )
  }

  const historico = Array.isArray(data.historico) ? data.historico : []

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/requisicoes-amostra-comercial"
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {data.titulo || `Requisição #${data.id}`}
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">#{data.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium" style={{
            backgroundColor: hexToRgba(getColor(data.status), 0.15),
            color: getColor(data.status),
          }}>
            {getLabel(data.status)}
          </span>
          <button
            onClick={handleGerarPdf}
            disabled={gerandoPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {gerandoPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {gerandoPdf ? "Gerando..." : "PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={18} />
            Dados da Requisição
          </h2>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Produto</p>
                {data.produto ? (
                  <Link
                    href={`/cadastros/produto-cru/${data.produto.id}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {data.produto.codigoPdm || data.produtoCodigo} — {data.produto.descricao || data.produtoDescricao}
                  </Link>
                ) : (
                  <p className="font-medium">
                    {data.produtoCodigo || "—"}{data.produtoDescricao ? ` — ${data.produtoDescricao}` : ""}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Cliente</p>
                <p className="font-medium">{data.cliente || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Quantidade</p>
                <p className="font-medium">{data.quantidade || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Prazo Desejado</p>
                <p className="font-medium">
                  {data.prazoDesejado ? new Date(data.prazoDesejado).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Solic. Desenvolvimento ID</p>
                <p className="font-medium">{data.solicitacaoDesenvolvimentoId || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Criado em</p>
                <p className="font-medium">
                  {data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400">Motivo</p>
              <p className="font-medium">{data.motivo || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400">Observações</p>
              <p className="font-medium whitespace-pre-wrap">{data.observacoes || "—"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} />
            Histórico
          </h2>
          {historico.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {historico.map((h: any, idx: number) => (
                <div key={idx} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                  <p className="text-sm font-medium">{h.acao || h.status || "Atualização"}</p>
                  {h.descricao && <p className="text-xs text-slate-600 mt-0.5">{h.descricao}</p>}
                  {h.observacao && <p className="text-xs text-slate-500 mt-0.5 italic">&ldquo;{h.observacao}&rdquo;</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {h.usuario && <><User size={10} className="inline mr-0.5" />{h.usuario} — </>}
                    {h.data ? new Date(h.data).toLocaleString("pt-BR") : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sem histórico registrado</p>
          )}
        </div>
      </div>
    </div>
  )
}
