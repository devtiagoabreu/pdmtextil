"use client"

import { useQuery } from "@tanstack/react-query"
import { Package, Layers, ClipboardList, Calendar, CheckSquare, BarChart3, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface Contagem {
  ativos: number
  categorias: number
  tiposVistoria: number
  planos: number
  vistorias: number
}

interface Card {
  href: string
  icon: typeof Package
  titulo: string
  descricao: string
  campo?: keyof Contagem
}

const CARDS: Card[] = [
  {
    href: "/ativos/ativos",
    icon: Package,
    titulo: "Ativos",
    descricao: "Equipamentos e instalações cadastradas",
    campo: "ativos",
  },
  {
    href: "/ativos/categorias",
    icon: Layers,
    titulo: "Categorias",
    descricao: "Classificação e área responsável",
    campo: "categorias",
  },
  {
    href: "/ativos/tipos-vistoria",
    icon: ClipboardList,
    titulo: "Tipos de Vistoria",
    descricao: "Checklists, periodicidade e base legal",
    campo: "tiposVistoria",
  },
  {
    href: "/ativos/planos",
    icon: Calendar,
    titulo: "Planos de Vistoria",
    descricao: "Vínculo entre ativos e tipos de vistoria",
    campo: "planos",
  },
  {
    href: "/ativos/vistorias",
    icon: CheckSquare,
    titulo: "Vistorias (Agenda)",
    descricao: "Ocorrências programadas e executadas",
    campo: "vistorias",
  },
  {
    href: "/ativos/dashboard",
    icon: BarChart3,
    titulo: "Dashboard",
    descricao: "Indicadores e conformidade por área",
  },
]

export default function AtivosHomePage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const { data: contagem, isLoading } = useQuery<Contagem>({
    queryKey: ["ativos-contagens"],
    queryFn: async () => {
      const [ativos, categorias, tiposVistoria, planos, vistorias] = await Promise.all([
        fetch("/api/ativos/ativos").then(r => r.json()),
        fetch("/api/ativos/categorias").then(r => r.json()),
        fetch("/api/ativos/tipos-vistoria").then(r => r.json()),
        fetch("/api/ativos/planos").then(r => r.json()),
        fetch("/api/ativos/vistorias").then(r => r.json()),
      ])
      return {
        ativos: Array.isArray(ativos) ? ativos.length : 0,
        categorias: Array.isArray(categorias) ? categorias.length : 0,
        tiposVistoria: Array.isArray(tiposVistoria) ? tiposVistoria.length : 0,
        planos: Array.isArray(planos) ? planos.length : 0,
        vistorias: Array.isArray(vistorias) ? vistorias.length : 0,
      }
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Ativos e Vistorias
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gestão de ativos, vistorias periódicas e conformidade.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map(({ href, icon: Icon, titulo, descricao, campo }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon size={20} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-slate-50">{titulo}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{descricao}</p>
                  </div>
                </div>
                {campo ? (
                  <span className="text-2xl font-bold text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                    {contagem?.[campo] ?? 0}
                  </span>
                ) : (
                  <ArrowRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}