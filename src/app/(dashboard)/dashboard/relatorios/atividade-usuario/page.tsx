"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Activity, Filter, UserCheck } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type Stats = {
  total: number
  totalUsuarios: number
  primeiraAtividade: string | null
  ultimaAtividade: string | null
}

type UserActivity = {
  usuario: string
  total: number
}

type TipoActivity = {
  tipo: string
  total: number
}

type RecentLog = {
  id: number
  tipo: string
  acao: string
  descricao: string
  entidade: string
  entidadeId: number
  usuario: string
  createdAt: string
}

const TIPO_CORES: Record<string, string> = {
  DELECAO: "#ef4444",
  ERRO_SISTEMA: "#f97316",
  LOGIN: "#3b82f6",
  CADASTRO: "#22c55e",
  SISTEMA: "#6366f1",
}

const TIPO_LABELS: Record<string, string> = {
  DELECAO: "Deleção",
  ERRO_SISTEMA: "Erro",
  LOGIN: "Login",
  CADASTRO: "Cadastro",
  SISTEMA: "Sistema",
}

export default function RelatorioAtividadeUsuario() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [porUsuario, setPorUsuario] = useState<UserActivity[]>([])
  const [porTipo, setPorTipo] = useState<TipoActivity[]>([])
  const [recentes, setRecentes] = useState<RecentLog[]>([])
  const [tiposDisponiveis, setTiposDisponiveis] = useState<string[]>([])
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [usuarioFiltro, setUsuarioFiltro] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("")

  function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (dataInicio) params.set("dataInicio", dataInicio)
    if (dataFim) params.set("dataFim", dataFim)
    if (usuarioFiltro) params.set("usuario", usuarioFiltro)
    if (tipoFiltro) params.set("tipo", tipoFiltro)

    fetch(`/api/relatorios/atividade-usuario?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats)
        setPorUsuario(data.porUsuario || [])
        setPorTipo(data.porTipo || [])
        setRecentes(data.recentes || [])
        setTiposDisponiveis(data.filtros?.tipos || [])
        setUsuariosDisponiveis(data.filtros?.usuarios || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Relatório: Atividade por Usuário{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Registro de ações realizadas por cada usuário no sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Filter size={14} /> Filtros
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Data fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Usuário</label>
          <select
            value={usuarioFiltro}
            onChange={(e) => setUsuarioFiltro(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm min-w-[140px]"
          >
            <option value="">Todos</option>
            {usuariosDisponiveis.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tipo</label>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm min-w-[140px]"
          >
            <option value="">Todos</option>
            {tiposDisponiveis.map((t) => (
              <option key={t} value={t}>{TIPO_LABELS[t] || t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchData}
          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Ações</p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Usuários Ativos</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.totalUsuarios}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Primeira Atividade</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.primeiraAtividade ? new Date(stats.primeiraAtividade).toLocaleDateString("pt-BR") : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Última Atividade</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
              {stats.ultimaAtividade ? new Date(stats.ultimaAtividade).toLocaleDateString("pt-BR") : "-"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart - by user */}
        {porUsuario.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              <UserCheck size={16} className="inline mr-1" /> Ações por Usuário
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porUsuario} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="usuario" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Ações" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pie chart - by type */}
        {porTipo.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              <Activity size={16} className="inline mr-1" /> Distribuição por Tipo
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={porTipo}
                    dataKey="total"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props: any) => `${TIPO_LABELS[props.tipo] || props.tipo} ${(props.percent * 100).toFixed(0)}%`}
                  >
                    {porTipo.map((entry, i) => (
                      <Cell key={i} fill={TIPO_CORES[entry.tipo] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(value) => TIPO_LABELS[value] || value} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent activity log */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Atividades Recentes</h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : recentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma atividade encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Data</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Usuário</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Ação</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "-"}
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{r.usuario || "-"}</td>
                    <td className="p-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: (TIPO_CORES[r.tipo] || "#94a3b8") + "20",
                          color: TIPO_CORES[r.tipo] || "#94a3b8",
                        }}
                      >
                        {TIPO_LABELS[r.tipo] || r.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{r.acao}</td>
                    <td className="p-3 text-slate-500 text-xs max-w-xs truncate">{r.descricao || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
