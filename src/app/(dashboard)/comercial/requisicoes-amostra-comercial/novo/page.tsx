"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ProdutoCru {
  id: number
  codigoPdm: string
  descricao: string
}

export default function NovaRequisicaoAmostraComercialPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [submitting, setSubmitting] = useState(false)

  const [produtoSearch, setProdutoSearch] = useState("")
  const [produtos, setProdutos] = useState<ProdutoCru[]>([])
  const [produtosLoading, setProdutosLoading] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<ProdutoCru | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [titulo, setTitulo] = useState("")
  const [cliente, setCliente] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [motivo, setMotivo] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [prazoDesejado, setPrazoDesejado] = useState("")
  const [solicitacaoDesenvolvimentoId, setSolicitacaoDesenvolvimentoId] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (produtoSearch.length < 2) {
      setProdutos([])
      return
    }
    setProdutosLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/cadastros/produtos-cru?search=${encodeURIComponent(produtoSearch)}&limit=10`)
        .then(r => r.json())
        .then(data => setProdutos(Array.isArray(data) ? data : []))
        .catch(() => setProdutos([]))
        .finally(() => setProdutosLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [produtoSearch])

  const handleSelectProduto = (p: ProdutoCru) => {
    setSelectedProduto(p)
    setProdutoSearch(`${p.codigoPdm} — ${p.descricao}`)
    setShowDropdown(false)
    setErrors(prev => { const next = { ...prev }; delete next.produtoCruId; return next })
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!selectedProduto) errs.produtoCruId = "Selecione um produto"
    if (!titulo.trim()) errs.titulo = "Título é obrigatório"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        produtoCruId: selectedProduto!.id,
        titulo: titulo.trim(),
        cliente: cliente.trim() || null,
        quantidade: quantidade.trim() || null,
        motivo: motivo.trim() || null,
        observacoes: observacoes.trim() || null,
        prazoDesejado: prazoDesejado || null,
        solicitacaoDesenvolvimentoId: solicitacaoDesenvolvimentoId.trim()
          ? parseInt(solicitacaoDesenvolvimentoId.trim())
          : null,
      }

      const res = await fetch("/api/requisicoes-amostra-comercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao criar requisição")
      }
      toast.success("Requisição criada com sucesso")
      router.push("/comercial/requisicoes-amostra-comercial")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar requisição")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Nova Requisição de Amostra Comercial{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Preencha os dados da requisição de amostra comercial</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/comercial/requisicoes-amostra-comercial")}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Dados da Requisição</h2>

          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label htmlFor="produto">
              Produto <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="produto"
                value={produtoSearch}
                onChange={e => {
                  setProdutoSearch(e.target.value)
                  setSelectedProduto(null)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar produto por código ou descrição..."
                className="pl-9"
              />
              {produtosLoading && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>
            {errors.produtoCruId && (
              <p className="text-xs text-red-500">{errors.produtoCruId}</p>
            )}
            {showDropdown && produtos.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg max-h-48 overflow-y-auto">
                {produtos.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduto(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                  >
                    <span className="font-mono text-blue-600 dark:text-blue-400">{p.codigoPdm}</span>
                    <span className="text-slate-500 ml-2">{p.descricao}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Amostra para aprovação do cliente"
            />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input
              id="cliente"
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                placeholder="Ex: 5 metros"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazoDesejado">Prazo Desejado</Label>
              <Input
                id="prazoDesejado"
                type="date"
                value={prazoDesejado}
                onChange={e => setPrazoDesejado(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="solicitacaoDesenvolvimentoId">Solicitação de Desenvolvimento ID</Label>
            <Input
              id="solicitacaoDesenvolvimentoId"
              type="number"
              value={solicitacaoDesenvolvimentoId}
              onChange={e => setSolicitacaoDesenvolvimentoId(e.target.value)}
              placeholder="ID da solicitação de desenvolvimento (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Por que esta amostra é necessária?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {submitting ? "Salvando..." : "Salvar Requisição"}
          </Button>
        </div>
      </form>
    </div>
  )
}
