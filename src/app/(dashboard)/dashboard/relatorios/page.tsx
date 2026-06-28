"use client"

import Link from "next/link"
import { BarChart3, Activity, FileText, Clock, FlaskConical, CheckCircle2, Filter, Beaker, History } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const relatorios = [
  { href: "/dashboard/relatorios/atividade-usuario", label: "Atividade por Usuário", desc: "Acompanhe ações, gráficos e logs de cada usuário", icon: Activity },
  { href: "/dashboard/relatorios/solicitacoes-criadas", label: "Criadas / Deletadas", desc: "Solicitações de desenvolvimento criadas, deletadas e concluídas por mês", icon: FileText },
  { href: "/dashboard/relatorios/tempo-status", label: "Tempo em cada Status (Solic.)", desc: "Tempo gasto em cada status das solicitações de desenvolvimento", icon: Clock },
  { href: "/dashboard/relatorios/tempo-status-amostras", label: "Tempo em cada Status (Amostras)", desc: "Tempo gasto em cada status das amostras de desenvolvimento", icon: FlaskConical },
  { href: "/dashboard/relatorios/solicitacoes-concluidas", label: "Concluídas Desenvolvimento", desc: "Solicitações concluídas em desenvolvimento — total, tipo e detalhes", icon: CheckCircle2 },
  { href: "/dashboard/relatorios/solicitacoes-por-status", label: "Solicitações de Desenvolvimento por Status", desc: "Filtre solicitações de desenvolvimento por status — total, distribuição por tipo e detalhes", icon: Filter },
  { href: "/dashboard/relatorios/amostras-por-status", label: "Amostras de Desenvolvimento por Status", desc: "Filtre amostras de desenvolvimento por status — total, tipo (cru/acab.) e detalhamento", icon: Beaker },
  { href: "/dashboard/relatorios/historico-solicitacao", label: "Histórico de Solicitação de Desenvolvimento", desc: "Histórico completo de uma solicitação de desenvolvimento: dados, produtos, amostras e timeline", icon: History },
  { href: "/dashboard/relatorios/historico-amostra", label: "Histórico de Amostra de Desenvolvimento", desc: "Histórico completo de uma amostra de desenvolvimento: dados, produto, solicitação e timeline", icon: Beaker },
  { href: "/dashboard/relatorios/amostra-comercial-por-status", label: "Amostras Comerciais por Status", desc: "Filtre requisições de amostra comercial por status — total, distribuição e detalhamento", icon: Filter },
]

export default function RelatoriosHubPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatórios{info && <InfoButton content={info} />}</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Relatórios e análises do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatorios.map(rel => {
          const Icon = rel.icon
          return (
            <Link
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
