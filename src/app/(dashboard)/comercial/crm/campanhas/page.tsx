"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, Megaphone, Calendar, TrendingUp, Users, DollarSign, ArrowRight, Loader2 } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  REDES: "Redes Sociais",
  EVENTO: "Evento",
}

const TIPO_CORES: Record<string, string> = {
  EMAIL: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  WHATSAPP: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  REDES: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  EVENTO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
}

const STATUS_CORES: Record<string, string> = {
  ATIVA: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  PAUSADA: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  CONCLUIDA: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
}

export default function CampanhasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["crm-campanhas"],
    queryFn: () => fetch("/api/crm/campanhas").then((r) => r.json()),
  })

  const campanhas = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Campanhas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie campanhas de marketing e comunicação
          </p>
        </div>
        <Link
          href="/comercial/crm/campanhas/nova"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nova Campanha
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
        </div>
      ) : campanhas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma campanha cadastrada</p>
          <Link href="/comercial/crm/campanhas/nova" className="text-sm text-blue-600 hover:underline mt-2">
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((camp: any) => (
            <Link
              key={camp.id}
              href={`/comercial/crm/campanhas/${camp.id}`}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`rounded-lg p-2 ${TIPO_CORES[camp.tipo]?.split(" ")[1] || "bg-slate-100"}`}>
                    <Megaphone size={16} className={TIPO_CORES[camp.tipo]?.split(" ")[0] || "text-slate-500"} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{camp.nome}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIPO_CORES[camp.tipo] || "text-slate-600 bg-slate-100"}`}>
                      {TIPO_LABELS[camp.tipo] || camp.tipo}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_CORES[camp.status] || ""}`}>
                  {camp.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                {camp.dataInicio && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(camp.dataInicio).toLocaleDateString("pt-BR")}
                  </span>
                )}
                {camp.leadsGerados > 0 && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {camp.leadsGerados} leads
                  </span>
                )}
              </div>

              {(camp.orcamento || camp.custoAquisicao) && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {camp.orcamento && (
                    <span className="text-slate-500">
                      Orçamento:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {Number(camp.orcamento).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </span>
                  )}
                  {camp.custoAquisicao && (
                    <span className="text-slate-500">
                      CPA:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {Number(camp.custoAquisicao).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
