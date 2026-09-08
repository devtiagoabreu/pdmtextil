"use client"

import { useQuery } from "@tanstack/react-query"
import { Building2, Factory, Boxes, Workflow, GitBranch, ClipboardList, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const CARDS = [
  {
    href: "/processos/empresas",
    icon: Building2,
    titulo: "Empresas",
    descricao: "Organizações do workspace de engenharia",
    campo: "empresas",
  },
  {
    href: "/processos/sites",
    icon: Factory,
    titulo: "Sites",
    descricao: "Unidades físicas ou plantas",
    campo: "sites",
  },
  {
    href: "/processos/areas",
    icon: Boxes,
    titulo: "Áreas",
    descricao: "Departamentos ou setores",
    campo: "areas",
  },
  {
    href: "/processos/processos",
    icon: Workflow,
    titulo: "Processos",
    descricao: "Objetos centrais com riscos, controles e indicadores",
    campo: "processos",
  },
  {
    href: "/processos/subprocessos",
    icon: GitBranch,
    titulo: "Subprocessos",
    descricao: "Decomposição das etapas",
    campo: "subprocessos",
  },
  {
    href: "/processos/atividades",
    icon: ClipboardList,
    titulo: "Atividades",
    descricao: "Unidades elementares de execução",
    campo: "atividades",
  },
]

export default function ProcessosHomePage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const { data: contagem, isLoading } = useQuery({
    queryKey: ["proc-contagens"],
    queryFn: async () => {
      const [empresas, sites, areas, processos, subprocessos, atividades] = await Promise.all([
        fetch("/api/processos/empresas").then(r => r.json()),
        fetch("/api/processos/sites").then(r => r.json()),
        fetch("/api/processos/areas").then(r => r.json()),
        fetch("/api/processos/processos").then(r => r.json()),
        fetch("/api/processos/subprocessos").then(r => r.json()),
        fetch("/api/processos/atividades").then(r => r.json()),
      ])
      return {
        empresas: Array.isArray(empresas) ? empresas.length : 0,
        sites: Array.isArray(sites) ? sites.length : 0,
        areas: Array.isArray(areas) ? areas.length : 0,
        processos: Array.isArray(processos) ? processos.length : 0,
        subprocessos: Array.isArray(subprocessos) ? subprocessos.length : 0,
        atividades: Array.isArray(atividades) ? atividades.length : 0,
      }
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Engenharia de Processos
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Mapeie a organização de Empresa até Atividade e documente cada processo com objetivo, entradas/saídas,
          fornecedores, recursos, riscos, controles e indicadores.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Hierarquia do mapeamento</span>
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
          Empresa <ArrowRight size={14} /> Site <ArrowRight size={14} /> Área <ArrowRight size={14} /> Processo{" "}
          <ArrowRight size={14} /> Subprocesso <ArrowRight size={14} /> Atividade
        </span>
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
                <span className="text-2xl font-bold text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                  {contagem?.[campo as "empresas"] ?? 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}