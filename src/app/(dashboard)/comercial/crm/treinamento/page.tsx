"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BookOpen, GraduationCap, ChevronRight, FileText,
  BookMarked, Video, ExternalLink, Settings, Printer,
} from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useState } from "react"

const ICONE_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={20} />,
  GraduationCap: <GraduationCap size={20} />,
  BookMarked: <BookMarked size={20} />,
  FileText: <FileText size={20} />,
}

type Modulo = {
  id: number
  titulo: string
  descricao: string | null
  icone: string | null
  cor: string | null
  ordem: number
  ativo: boolean
  licoes: { id: number; titulo: string; ordem: number; ativo: boolean; pathnameRelacionado: string | null }[]
}

export default function TreinamentoPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [moduloAberto, setModuloAberto] = useState<number | null>(null)

  const { data: modulos, isLoading } = useQuery<Modulo[]>({
    queryKey: ["crm-treinamento"],
    queryFn: () => fetch("/api/crm/treinamento").then((r) => r.json()),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Treinamento CRM{info && <InfoButton content={info} />}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/comercial/crm/treinamento/exportar-pdf"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <Printer size={16} />
            Exportar Treinamento Completo
          </Link>
          <Link
            href="/comercial/crm/treinamento/admin"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <Settings size={16} />
            Gerenciar
          </Link>
        </div>
      </div>

      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-3xl">
        Documentação completa do CRM com explicações campo a campo, pré-cadastros necessários, 
        links para POPs e vídeos tutoriais. Use este guia para aprender como cada tela funciona 
        e por que cada campo é importante.
      </p>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {modulos?.filter((m) => m.ativo).map((modulo) => (
            <div
              key={modulo.id}
              className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setModuloAberto(moduloAberto === modulo.id ? null : modulo.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: modulo.cor || "#6366f1" }}
                >
                  {ICONE_MAP[modulo.icone || "BookOpen"] || <BookOpen size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-50">{modulo.titulo}</h2>
                  {modulo.descricao && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{modulo.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{modulo.licoes.length} {modulo.licoes.length === 1 ? "lição" : "lições"}</span>
                  <ChevronRight
                    size={18}
                    className={`transition-transform ${moduloAberto === modulo.id ? "rotate-90" : ""}`}
                  />
                </div>
              </button>

              {moduloAberto === modulo.id && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {modulo.licoes.filter((l) => l.ativo).length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 text-center">Nenhuma lição neste módulo</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {modulo.licoes.filter((l) => l.ativo).map((licao) => (
                        <Link
                          key={licao.id}
                          href={`/comercial/crm/treinamento/${licao.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                        >
                          <FileText size={16} className="text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {licao.titulo}
                          </span>
                          {licao.pathnameRelacionado && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
                              {licao.pathnameRelacionado}
                            </span>
                          )}
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
