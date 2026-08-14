"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FileText, Pencil, Unlink, Search, Loader2, Link2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

type Produto = {
  id: number
  codigoPdm: string
  descricao: string
  status: string
}

export function Produtos({
  produtos,
  solicitacaoId,
  onAtualizar,
}: {
  produtos: any[]
  solicitacaoId: string
  onAtualizar: () => void
}) {
  const [busca, setBusca] = useState("")
  const [catalogo, setCatalogo] = useState<Produto[]>([])
  const [loadingCatalogo, setLoadingCatalogo] = useState(false)
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [vinculando, setVinculando] = useState(false)
  const [removendo, setRemovendo] = useState<Produto | null>(null)
  const [removendoLoading, setRemovendoLoading] = useState(false)

  useEffect(() => {
    let ativo = true
    setLoadingCatalogo(true)
    fetch("/api/cadastros/produto-cru")
      .then((r: any) => r.json())
      .then((data: any) => {
        if (!ativo) return
        if (Array.isArray(data)) setCatalogo(data)
      })
      .catch(console.error)
      .finally(() => {
        if (ativo) setLoadingCatalogo(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const vinculadosIds = useMemo(() => new Set(produtos.map((p) => p.id)), [produtos])

  const disponiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return catalogo
      .filter((p) => !vinculadosIds.has(p.id))
      .filter((p) => {
        if (!q) return true
        return `${p.codigoPdm} ${p.descricao}`.toLowerCase().includes(q)
      })
  }, [catalogo, vinculadosIds, busca])

  const toggleSelecao = (id: number) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const vincular = async () => {
    if (selecionados.length === 0) return
    setVinculando(true)
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/produtos-cru`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtos: selecionados }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao vincular produtos")
      toast.success(`${selecionados.length} produto(s) vinculado(s)`)
      setSelecionados([])
      setBusca("")
      onAtualizar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao vincular produtos")
    } finally {
      setVinculando(false)
    }
  }

  const desvincular = async () => {
    if (!removendo) return
    setRemovendoLoading(true)
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/produtos-cru`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtos: [removendo.id] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao desvincular produto")
      toast.success("Produto desvinculado da solicitação")
      setRemovendo(null)
      onAtualizar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao desvincular produto")
    } finally {
      setRemovendoLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText size={20} />
        Produtos Desenvolvidos
      </h2>

      {produtos.length > 0 ? (
        <div className="space-y-3">
          {produtos.map((p: any) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Link
                href={`/cadastros/produto-cru/${p.id}`}
                className="min-w-0 flex-1"
              >
                <p className="font-medium text-sm">{p.codigoPdm} — {p.descricao}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status:{" "}
                  <span className={`font-medium ${
                    p.status === "APROVADO" ? "text-green-600" :
                    p.status === "EM_PRODUCAO" ? "text-blue-600" :
                    "text-slate-600"
                  }`}>{p.status}</span>
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setRemovendo(p)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Unlink size={14} />
                  Desvincular
                </button>
                <Link
                  href={`/cadastros/produto-cru/${p.id}`}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  <Pencil size={14} />
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Nenhum produto cadastrado para esta solicitação.</p>
      )}

      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Link2 size={16} />
            Vincular produtos à solicitação
          </p>
          <span className="text-xs text-slate-500">{selecionados.length} selecionado(s)</span>
        </div>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código PDM ou descrição..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {loadingCatalogo ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
            <Loader2 className="animate-spin" size={16} />
            Carregando produtos...
          </div>
        ) : disponiveis.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">
            {busca ? "Nenhum produto disponível encontrado." : "Todos os produtos já estão vinculados a esta solicitação."}
          </p>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {disponiveis.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selecionados.includes(p.id)}
                  onChange={() => toggleSelecao(p.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/40"
                />
                <span className="text-sm font-mono text-slate-500 shrink-0">{p.codigoPdm}</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.descricao}</span>
              </label>
            ))}
          </div>
        )}

        <button
          onClick={vincular}
          disabled={selecionados.length === 0 || vinculando}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {vinculando ? <Loader2 className="animate-spin" size={16} /> : <Link2 size={16} />}
          Vincular
        </button>
      </div>

      <ConfirmModal
        open={removendo !== null}
        title="Desvincular produto?"
        message={`Tem certeza que deseja desvincular "${removendo?.codigoPdm} — ${removendo?.descricao}" desta solicitação?`}
        confirmLabel="Desvincular"
        variant="danger"
        loading={removendoLoading}
        onConfirm={desvincular}
        onCancel={() => setRemovendo(null)}
      />
    </div>
  )
}
