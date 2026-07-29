import Link from "next/link"
import { BarChart3, Activity, FileText, Clock, FlaskConical, CheckCircle2, Filter, Beaker, History } from "lucide-react"
import { PageInfoButton } from "@/components/ui/page-info-button"

const relatorios = [
  { href: "/dashboard/relatorios/atividade-usuario", label: "Atividade por UsuÃ¡rio", desc: "Acompanhe aÃ§Ãµes, grÃ¡ficos e logs de cada usuÃ¡rio", icon: Activity },
  { href: "/dashboard/relatorios/solicitacoes-criadas", label: "Criadas / Deletadas", desc: "SolicitaÃ§Ãµes de desenvolvimento criadas, deletadas e concluÃ­das por mÃªs", icon: FileText },
  { href: "/dashboard/relatorios/tempo-status", label: "Tempo em cada Status (Solic.)", desc: "Tempo gasto em cada status das solicitaÃ§Ãµes de desenvolvimento", icon: Clock },
  { href: "/dashboard/relatorios/tempo-status-amostras", label: "Tempo em cada Status (Amostras)", desc: "Tempo gasto em cada status das amostras de desenvolvimento", icon: FlaskConical },
  { href: "/dashboard/relatorios/solicitacoes-concluidas", label: "ConcluÃ­das Desenvolvimento", desc: "SolicitaÃ§Ãµes concluÃ­das em desenvolvimento â€” total, tipo e detalhes", icon: CheckCircle2 },
  { href: "/dashboard/relatorios/solicitacoes-por-status", label: "SolicitaÃ§Ãµes de Desenvolvimento por Status", desc: "Filtre solicitaÃ§Ãµes de desenvolvimento por status â€” total, distribuiÃ§Ã£o por tipo e detalhes", icon: Filter },
  { href: "/dashboard/relatorios/amostras-por-status", label: "Amostras de Desenvolvimento por Status", desc: "Filtre amostras de desenvolvimento por status â€” total, tipo (cru/acab.) e detalhamento", icon: Beaker },
  { href: "/dashboard/relatorios/historico-solicitacao", label: "HistÃ³rico de SolicitaÃ§Ã£o de Desenvolvimento", desc: "HistÃ³rico completo de uma solicitaÃ§Ã£o de desenvolvimento: dados, produtos, amostras e timeline", icon: History },
  { href: "/dashboard/relatorios/historico-amostra", label: "HistÃ³rico de Amostra de Desenvolvimento", desc: "HistÃ³rico completo de uma amostra de desenvolvimento: dados, produto, solicitaÃ§Ã£o e timeline", icon: Beaker },
  { href: "/dashboard/relatorios/amostra-comercial-por-status", label: "Amostras Comerciais por Status", desc: "Filtre requisiÃ§Ãµes de amostra comercial por status â€” total, distribuiÃ§Ã£o e detalhamento", icon: Filter },
]

export default function RelatoriosHubPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">RelatÃ³rios<PageInfoButton /></h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">RelatÃ³rios e anÃ¡lises do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatorios.map((rel: any) => {
          const Icon = rel.icon
          return (
            <Link prefetch={false}
              key={rel.href}
              href={rel.href}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
            >
              <div className="inline-flex p-3 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-950/50 mb-3">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                {rel.label}
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{rel.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
