"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeft, Loader2, GraduationCap, BookOpen, Download,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { exportTreinamentoCompletoPdf } from "@/lib/export-treinamento-pdf"

type LicaoCompleta = {
  id: number
  titulo: string
  conteudoMd: string
  preRequisitos: string | null
  ordem: number
  ativo: boolean
}

type ModuloCompleto = {
  id: number
  titulo: string
  descricao: string | null
  icone: string | null
  cor: string | null
  ordem: number
  ativo: boolean
  licoes: LicaoCompleta[]
}

export default function ExportarPdfPage() {
  const router = useRouter()
  const [exportando, setExportando] = useState(false)

  const { data: modulos, isLoading } = useQuery<ModuloCompleto[]>({
    queryKey: ["crm-treinamento-exportar-pdf"],
    queryFn: () => fetch("/api/crm/treinamento/exportar-pdf").then((r) => r.json()),
  })

  const handleExportPdf = async () => {
    if (!modulos || modulos.length === 0) return
    setExportando(true)
    try {
      await exportTreinamentoCompletoPdf(modulos)
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <style>{`
        .modulo-section { margin-bottom: 40px; }
        .licao-section { margin-bottom: 30px; }
        .pdf-content { width: 210mm; padding: 0 10mm; font-size: 11px; line-height: 1.5; color: #222; font-family: Arial, sans-serif; }
        .pdf-content h1 { font-size: 20px; margin-top: 0; }
        .pdf-content h2 { font-size: 16px; }
        .pdf-content h3 { font-size: 14px; }
        .pdf-content table { font-size: 10px; border-collapse: collapse; width: 100%; }
        .pdf-content table td, .pdf-content table th { border: 1px solid #ccc; padding: 4px 6px; }
        .pdf-content pre { white-space: pre-wrap; word-break: break-word; font-size: 10px; }
        .pdf-content code { font-size: 10px; }
        .pdf-content img { max-height: 250px; }
        .pdf-content p, .pdf-content li, .pdf-content td { font-size: 11px; }
        .pdf-content blockquote { border-left: 3px solid #6366f1; padding-left: 12px; color: #444; }
        .pdf-content strong { color: #111; }
      `}</style>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="no-print flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Exportar Treinamento Completo</h1>
            <p className="text-sm text-slate-500 mt-1">
              Esta página contém todos os módulos e lições do treinamento CRM.
              Clique em {'\u201C'}Exportar PDF{'\u201D'} para gerar o arquivo completo.
            </p>
          </div>
          <button
            onClick={handleExportPdf}
            disabled={exportando}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {exportando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exportando ? "Gerando PDF..." : "Baixar PDF"}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : !modulos || modulos.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Nenhum módulo de treinamento encontrado.
          </div>
        ) : (
          <div className="pdf-content">
            <div className="no-print mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <h2 className="font-semibold text-indigo-800 mb-2">📄 Resumo do Documento</h2>
              <p className="text-sm text-indigo-700">
                {modulos.length} módulos • {modulos.reduce((acc, m) => acc + m.licoes.filter(l => l.ativo).length, 0)} lições
                • Gerado em {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>

            {/* Capa */}
            <div className="text-center py-16 mb-8 border-b border-slate-200">
              <GraduationCap size={48} className="text-indigo-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Treinamento CRM</h1>
              <p className="text-lg text-slate-500">PDM Têxtil</p>
              <p className="text-sm text-slate-400 mt-4">
                Documento completo com todos os módulos e lições
              </p>
              <p className="text-sm text-slate-400">
                Gerado em {new Date().toLocaleDateString("pt-BR")}
              </p>
              <div className="mt-8 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                <p>CRM construído com carinho por <strong>Tiago de Abreu — Engenheiro de Dados</strong></p>
                <p className="mt-2">
                  {'\u201C'}CRM não é sobre tecnologia, é sobre pessoas.
                  Pessoas atendendo melhor outras pessoas.{'\u201D'}
                </p>
              </div>
            </div>

            {/* Índice */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Índice</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                {modulos.filter(m => m.ativo).map((modulo) => (
                  <li key={modulo.id} className="font-medium">
                    {modulo.titulo}
                    <span className="text-slate-400 font-normal">
                      {' '}({modulo.licoes.filter(l => l.ativo).length} lição{modulo.licoes.filter(l => l.ativo).length !== 1 ? "ões" : ""})
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Módulos */}
            {modulos.filter(m => m.ativo).map((modulo) => (
              <div key={modulo.id} className="modulo-section mb-12">
                <div
                  className="flex items-center gap-3 mb-4 p-4 rounded-lg"
                  style={{ backgroundColor: (modulo.cor || "#6366f1") + "15" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: modulo.cor || "#6366f1" }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900" style={{ color: modulo.cor || "#6366f1" }}>
                      {modulo.titulo}
                    </h2>
                    {modulo.descricao && (
                      <p className="text-sm text-slate-500 mt-0.5">{modulo.descricao}</p>
                    )}
                  </div>
                </div>

                {modulo.licoes.filter(l => l.ativo).map((licao, idx) => (
                  <div key={licao.id} className="licao-section mb-8 pl-4 border-l-2 border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      {idx + 1}. {licao.titulo}
                    </h3>

                    {licao.preRequisitos && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                        <strong>Pré-cadastros Necessários:</strong> {licao.preRequisitos}
                      </div>
                    )}

                    <div className="prose prose-slate max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {licao.conteudoMd}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>


    </>
  )
}
