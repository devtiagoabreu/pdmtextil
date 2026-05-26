"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ItemLinha {
  codigoProduto: string
  ordem: string
  artigo: string
  cor: string
  desenho: string
  quantidade: string
}

function itemVazio(): ItemLinha {
  return { codigoProduto: "", ordem: "", artigo: "", cor: "", desenho: "", quantidade: "" }
}

export default function NovaRequisicaoCortePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [submitting, setSubmitting] = useState(false)
  const [itens, setItens] = useState<ItemLinha[]>([itemVazio()])
  const [observacoes, setObservacoes] = useState("")
  const [entreguePor, setEntreguePor] = useState("")

  const handleItemChange = (index: number, field: keyof ItemLinha, value: string) => {
    setItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addItem = () => {
    setItens(prev => [...prev, itemVazio()])
  }

  const removeItem = (index: number) => {
    if (itens.length <= 1) return
    setItens(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const itensValidos = itens.filter(item => item.quantidade.trim())
    if (itensValidos.length === 0) {
      toast.error("Adicione pelo menos um item com quantidade")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/comercial/requisicoes-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: itensValidos, observacoes, entreguePor }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao criar requisição")
      }
      toast.success("Requisição criada com sucesso")
      router.push("/comercial/requisicoes-corte")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar requisição")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Nova Requisição de Corte{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Preencha os dados da requisição de corte</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/comercial/requisicoes-corte")}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Itens de Corte</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cód. Produto</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Ordem</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Artigo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Desenho</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Qtd <span className="text-red-500">*</span></th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {itens.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <Input
                        value={item.codigoProduto}
                        onChange={(e) => handleItemChange(index, "codigoProduto", e.target.value)}
                        placeholder="2.K2620..."
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={item.ordem}
                        onChange={(e) => handleItemChange(index, "ordem", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={item.artigo}
                        onChange={(e) => handleItemChange(index, "artigo", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={item.cor}
                        onChange={(e) => handleItemChange(index, "cor", e.target.value)}
                        placeholder="Palha"
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={item.desenho}
                        onChange={(e) => handleItemChange(index, "desenho", e.target.value)}
                        placeholder="500101"
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, "quantidade", e.target.value)}
                        placeholder="2 M"
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <Plus size={14} />
            Adicionar Item
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Informações Adicionais</h2>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite aqui mais informações"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entreguePor">Entregue por</Label>
            <Input
              id="entreguePor"
              value={entreguePor}
              onChange={(e) => setEntreguePor(e.target.value)}
              placeholder="Vilma"
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
