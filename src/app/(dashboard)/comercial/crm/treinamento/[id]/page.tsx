"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, BookOpen, Video, ExternalLink, Printer,
  FileText, GraduationCap, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type Licao = {
  id: number
  moduloId: number
  moduloTitulo: string
  moduloCor: string | null
  moduloIcone: string | null
  titulo: string
  conteudoMd: string
  preRequisitos: string | null
  linksPop: { label: string; url: string }[]
  linksVideo: { label: string; url: string }[]
  pathnameRelacionado: string | null
  ordem: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

type Modulo = {
  id: number
  titulo: string
  licoes: { id: number; titulo: string; ordem: number; ativo: boolean }[]
}

export default function LicaoDetailPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const router = useRouter()

  const { data: licao, isLoading } = useQuery<Licao>({
    queryKey: ["crm-treinamento", params.id],
    queryFn: () => fetch(`/api/crm/treinamento/${params.id}`).then((r) => r.json()),
  })

  const { data: modulos } = useQuery<Modulo[]>({
    queryKey: ["crm-treinamento"],
    queryFn: () => fetch("/api/crm/treinamento").then((r) => r.json()),
  })

  const moduloAtual = modulos?.find((m) => m.id === licao?.moduloId)
  const licoesModulo = moduloAtual?.licoes?.filter((l) => l.ativo) || []
  const indexAtual = licoesModulo.findIndex((l) => l.id === licao?.id)
  const licaoAnterior = indexAtual > 0 ? licoesModulo[indexAtual - 1] : null
  const proximaLicao = indexAtual < licoesModulo.length - 1 ? licoesModulo[indexAtual + 1] : null

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (!licao) {
    return (
      <div className="p-6 text-center text-slate-400">
        Lição não encontrada
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 10px 20px;
            border-bottom: 1px solid #ddd;
            font-size: 10px;
            color: #666;
            background: white;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
          }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8px 20px;
            border-top: 1px solid #ddd;
            font-size: 9px;
            color: #999;
            background: white;
            z-index: 1000;
            text-align: center;
          }
          body { padding-top: 40px; padding-bottom: 30px; }
          @page { margin: 50px 30px; }
        }
      `}</style>

      <div className="print-header no-print">
        <span>PDM Têxtil - Treinamento CRM</span>
        <span>{licao.moduloTitulo} / {licao.titulo}</span>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="no-print flex items-center gap-4 mb-6">
          <Link
            href="/comercial/crm/treinamento"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <BookOpen size={14} />
            <Link href="/comercial/crm/treinamento" className="hover:text-indigo-600">Treinamento</Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">{licao.moduloTitulo}</span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 no-print"
              style={{ backgroundColor: licao.moduloCor || "#6366f1" }}
            >
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-0.5 no-print">
                <span>{licao.moduloTitulo}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {licao.titulo}{info && <InfoButton content={info} />}
              </h1>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer size={16} />
            Exportar PDF
          </button>
        </div>

        <div className="print-header">
          <span>PDM Têxtil - Treinamento CRM</span>
          <span>{licao.moduloTitulo} / {licao.titulo}</span>
        </div>

        {licao.preRequisitos && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl no-print">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Pré-cadastros Necessários</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap">{licao.preRequisitos}</p>
          </div>
        )}

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {licao.conteudoMd}
          </ReactMarkdown>
        </div>

        {(licao.linksPop?.length > 0 || licao.linksVideo?.length > 0) && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
            {licao.linksPop?.length > 0 && (
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  POPs Relacionados
                </h3>
                <ul className="space-y-2">
                  {licao.linksPop.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <ExternalLink size={14} />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {licao.linksVideo?.length > 0 && (
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Video size={16} className="text-red-500" />
                  Vídeos Tutoriais
                </h3>
                <ul className="space-y-2">
                  {licao.linksVideo.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Video size={14} />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="no-print flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <div>
            {licaoAnterior && (
              <Link
                href={`/comercial/crm/treinamento/${licaoAnterior.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft size={16} />
                {licaoAnterior.titulo}
              </Link>
            )}
          </div>
          <div>
            {proximaLicao && (
              <Link
                href={`/comercial/crm/treinamento/${proximaLicao.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {proximaLicao.titulo}
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="print-footer">
        PDM Têxtil - {licao.moduloTitulo} / {licao.titulo} — Gerado em {new Date().toLocaleDateString("pt-BR")}
      </div>
    </>
  )
}
