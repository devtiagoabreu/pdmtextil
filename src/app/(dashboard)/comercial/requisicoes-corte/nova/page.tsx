"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function NovaRequisicaoCortePage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    codigoProduto: "",
    ordem: "",
    artigo: "",
    cor: "",
    desenho: "",
    quantidade: "",
    observacoes: "",
    entreguePor: "",
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.quantidade.trim()) {
      toast.error("Quantidade é obrigatória")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/comercial/requisicoes-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <div className="max-w-2xl mx-auto py-8 space-y-6">
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoProduto">Cód. Produto</Label>
              <Input
                id="codigoProduto"
                value={form.codigoProduto}
                onChange={(e) => handleChange("codigoProduto", e.target.value)}
                placeholder="2.K2620.094.500101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem</Label>
              <Input
                id="ordem"
                value={form.ordem}
                onChange={(e) => handleChange("ordem", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artigo">Artigo</Label>
              <Input
                id="artigo"
                value={form.artigo}
                onChange={(e) => handleChange("artigo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                value={form.cor}
                onChange={(e) => handleChange("cor", e.target.value)}
                placeholder="Palha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desenho">Desenho</Label>
              <Input
                id="desenho"
                value={form.desenho}
                onChange={(e) => handleChange("desenho", e.target.value)}
                placeholder="500101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">
                Quantidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantidade"
                value={form.quantidade}
                onChange={(e) => handleChange("quantidade", e.target.value)}
                placeholder="2 M"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              placeholder="Digite aqui mais informações"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entreguePor">Entregue por</Label>
            <Input
              id="entreguePor"
              value={form.entreguePor}
              onChange={(e) => handleChange("entreguePor", e.target.value)}
              placeholder="Vilma"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? "Salvando..." : "Salvar Requisição"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
