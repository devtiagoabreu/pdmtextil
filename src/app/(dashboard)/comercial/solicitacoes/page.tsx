import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, and } from "drizzle-orm"
import Link from "next/link"
import { PlusCircle, FileText, Clock } from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  PENDENTE:       { label: "Pendente",       classes: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  EM_ANALISE:     { label: "Em Análise",     classes: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  AGUARDANDO_INFO:{ label: "Aguard. Info",   classes: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  APROVADO:       { label: "Aprovado",       classes: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400" },
  REPROVADO:      { label: "Reprovado",      classes: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  EM_PRODUCAO:    { label: "Em Produção",    classes: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" },
  CONCLUIDO:      { label: "Concluído",      classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

const TIPO_CONFIG: Record<string, string> = {
  DESENVOLVIMENTO_TECELAGEM:      "Tecelagem",
  DESENVOLVIMENTO_BENEFICIAMENTO: "Beneficiamento",
}

export default async function ListaSolicitacoesPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const userId = parseInt(session?.user?.id || "0")

  let conditions: any[] = []
  if (role === "COMERCIAL") conditions.push(eq(solicitacoes.solicitanteId, userId))
  if (role === "TECELAGEM") conditions.push(eq(solicitacoes.tipo, "DESENVOLVIMENTO_TECELAGEM"))
  if (role === "BENEFICIAMENTO") conditions.push(eq(solicitacoes.tipo, "DESENVOLVIMENTO_BENEFICIAMENTO"))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const lista = await db
    .select({
      id: solicitacoes.id,
      tipo: solicitacoes.tipo,
      status: solicitacoes.status,
      cliente: solicitacoes.cliente,
      projeto: solicitacoes.projeto,
      prazoDesejado: solicitacoes.prazoDesejado,
      createdAt: solicitacoes.createdAt,
      solicitanteNome: usuarios.name,
    })
    .from(solicitacoes)
    .leftJoin(usuarios, eq(solicitacoes.solicitanteId, usuarios.id))
    .where(where)
    .orderBy(desc(solicitacoes.createdAt))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {role === "COMERCIAL" ? "Minhas Solicitações" : "Solicitações Recebidas"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {lista.length} solicitação{lista.length !== 1 ? "ões" : ""} encontrada{lista.length !== 1 ? "s" : ""}
          </p>
        </div>
        {(role === "COMERCIAL" || role === "ADMIN") && (
          <Link
            href="/comercial/solicitacoes/nova"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Nova Solicitação
          </Link>
        )}
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma solicitação encontrada</p>
            {(role === "COMERCIAL" || role === "ADMIN") && (
              <Link
                href="/comercial/solicitacoes/nova"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                <PlusCircle size={14} />
                Criar primeira solicitação
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">#</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Projeto</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Prazo</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Criado em</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lista.map((s) => {
                    const statusCfg = STATUS_CONFIG[s.status] ?? { label: s.status, classes: "bg-slate-100 text-slate-600" }
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">#{s.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{s.cliente}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.projeto || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{TIPO_CONFIG[s.tipo] ?? s.tipo}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.classes}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {s.prazoDesejado
                            ? new Date(s.prazoDesejado).toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/comercial/solicitacoes/${s.id}`}
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                            >
                              Editar
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                if (confirm("Excluir solicitação?")) {
                                  fetch(`/api/solicitacoes/${s.id}`, { method: "DELETE" })
                                    .then(() => window.location.reload())
                                    .catch(() => alert("Erro ao excluir"))
                                }
                              }}
                              className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {lista.map((s) => {
                const statusCfg = STATUS_CONFIG[s.status] ?? { label: s.status, classes: "bg-slate-100 text-slate-600" }
                return (
                  <Link
                    key={s.id}
                    href={`/comercial/solicitacoes/${s.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{s.cliente}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.classes}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {s.projeto || TIPO_CONFIG[s.tipo] || s.tipo}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
