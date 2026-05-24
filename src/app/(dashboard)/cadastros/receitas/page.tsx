"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FlaskConical, Beaker, FileText, ChevronRight } from "lucide-react"

type ReceitaSimples = {
  id: number
  tipo: string
  tipoLabel: string
  possuiParametros: boolean
  contextType: "acabamento"
  contextId: number
  acabamento: string
  produtoId: number
  produtoCodigo: string
  produtoDescricao: string
}

type ReceitaCompleta = {
  id: number
  descricao: string
  instrucoes: string | null
  versao: number
  totalItens: number
  contextType: "amostra"
  contextId: number
  amostraDescricao: string | null
  acabamento: string
  produtoId: number
  produtoCodigo: string
  produtoDescricao: string
}

export default function ListaReceitasPage() {
  const [simples, setSimples] = useState<ReceitaSimples[]>([])
  const [completas, setCompletas] = useState<ReceitaCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<"simples" | "completas">("completas")

  useEffect(() => {
    fetch("/api/receitas")
      .then((r) => r.json())
      .then((data) => {
        setSimples(data.simples || [])
        setCompletas(data.completas || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Receitas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Receitas de beneficiamento associadas a produtos, acabamentos e amostras
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 w-fit">
        <button
          onClick={() => setAba("completas")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            aba === "completas"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FlaskConical size={14} className="inline mr-1" />
          Receitas Detalhadas ({completas.length})
        </button>
        <button
          onClick={() => setAba("simples")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            aba === "simples"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Beaker size={14} className="inline mr-1" />
          Receitas Simples ({simples.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando...</div>
      ) : aba === "completas" ? (
        completas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-slate-200 dark:border-slate-800">
            <FlaskConical className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma receita detalhada</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Produto</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Acabamento</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Descrição</th>
                  <th className="text-center p-3 text-xs font-medium text-slate-500 uppercase">Versão</th>
                  <th className="text-center p-3 text-xs font-medium text-slate-500 uppercase">Itens</th>
                  <th className="text-center p-3 text-xs font-medium text-slate-500 uppercase">Amostra</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {completas.map((r) => (
                  <tr key={`c-${r.id}`} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <Link href={`/cadastros/produto-cru/${r.produtoId}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {r.produtoCodigo}
                      </Link>
                      <p className="text-xs text-slate-500">{r.produtoDescricao}</p>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{r.acabamento}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{r.descricao}</td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-400">v{r.versao}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        {r.totalItens}
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs text-slate-500 truncate max-w-[120px]">
                      {r.amostraDescricao || `#${r.contextId}`}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/cadastros/produto-cru/${r.produtoId}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Abrir <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Simples tab */
        simples.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-slate-200 dark:border-slate-800">
            <Beaker className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma receita simples</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Produto</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Acabamento</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Tipo Receita</th>
                  <th className="text-center p-3 text-xs font-medium text-slate-500 uppercase">Parâmetros</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {simples.map((r) => (
                  <tr key={`s-${r.id}`} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <Link href={`/cadastros/produto-cru/${r.produtoId}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {r.produtoCodigo}
                      </Link>
                      <p className="text-xs text-slate-500">{r.produtoDescricao}</p>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{r.acabamento}</td>
                    <td className="p-3">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        {r.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {r.possuiParametros ? (
                        <span className="text-xs text-green-600 dark:text-green-400">Sim</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/cadastros/produto-cru/${r.produtoId}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Abrir <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
