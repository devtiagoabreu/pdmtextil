"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useRef, useState } from "react"
import {
  ArrowLeft, BookOpen, Video, ExternalLink, Printer,
  FileText, GraduationCap, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { exportElementToPdf } from "@/lib/export-pdf"

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
  const contentRef = useRef<HTMLDivElement>(null)
  const [exportando, setExportando] = useState(false)

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

  const handleExportPdf = async () => {
    if (!contentRef.current || !licao) return
    setExportando(true)
    try {
      const filename = `CRM-${licao.moduloTitulo}-${licao.titulo}.pdf`.replace(/[^a-zA-Z0-9-_.]/g, "_")
      await exportElementToPdf({
        element: contentRef.current,
        filename,
      })
    } finally {
      setExportando(false)
    }
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
          @page {
            size: A4;
            margin: 55px 25px 45px 25px;
            @bottom-center {
              content: counter(page);
              font-size: 9px;
              color: #666;
              font-family: Arial, sans-serif;
            }
          }
          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 8px 25px;
            border-bottom: 1px solid #ccc;
            font-size: 9px;
            color: #555;
            background: white;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            font-family: Arial, sans-serif;
          }
          .print-footer-text {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 5px 25px;
            border-top: 1px solid #ccc;
            font-size: 8px;
            color: #888;
            background: white;
            z-index: 1000;
            text-align: center;
            font-family: Arial, sans-serif;
          }
          body {
            padding-top: 0;
            padding-bottom: 0;
            font-size: 11px;
            line-height: 1.5;
            color: #222;
            font-family: Arial, sans-serif;
          }
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          h1 {
            font-size: 18px !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          h2 { font-size: 15px !important; page-break-after: avoid; }
          h3 { font-size: 13px !important; page-break-after: avoid; }
          table { font-size: 10px !important; }
          .prose { max-width: 100% !important; }
          .prose pre { white-space: pre-wrap; word-break: break-word; }
          .prose code { font-size: 10px; }
          .prose img { max-height: 300px; }
          .prose p, .prose li, .prose td { font-size: 11px; }
          .rounded-xl, .rounded-lg { border-radius: 4px !important; }
          .border { border-color: #ddd !important; }
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
            onClick={handleExportPdf}
            disabled={exportando}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {exportando ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            {exportando ? "Gerando PDF..." : "Exportar PDF"}
          </button>
        </div>

        <div className="print-header">
          <span>PDM Têxtil - Treinamento CRM</span>
          <span>{licao.moduloTitulo} / {licao.titulo}</span>
        </div>

        <div ref={contentRef} className="pdf-content">
          {licao.preRequisitos && (
            <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Pré-cadastros Necessários</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap">{licao.preRequisitos}</p>
            </div>
          )}

          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {licao.conteudoMd}
            </ReactMarkdown>
          </div>
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

      <div className="print-footer-text">
        PDM Têxtil - {licao.moduloTitulo} / {licao.titulo} — Gerado em {new Date().toLocaleDateString("pt-BR")}
      </div>
    </>
  )
}
