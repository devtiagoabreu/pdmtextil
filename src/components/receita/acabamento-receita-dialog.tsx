"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Receita = {
  id: number
  amostraId: number
  descricao: string
  instrucoes: string | null
}

type ReceitaItem = {
  id: number
  receitaId: number
  quimicoId: number | null
  descricao: string | null
  unidade: string
  quantidadeMetro: string
  estagio: string
  ordem: number
  quimicoNome: string | null
  quimicoCodigo: string | null
}

type ProdutoQuimico = {
  id: number
  codigo: string
  nome: string
  unidadePadrao: string
}

const ESTAGIOS = ["A", "B", "C", "D", "E", "F"]
const UNIDADES = ["g/L", "mL/L", "g/kg", "mL/kg", "%", "kg", "L"]

export function ReceitaDialog({
  produtoCruId,
  acabamentoId,
  amostraId,
  open,
  onClose,
}: {
  produtoCruId: number
  acabamentoId: number
  amostraId: number
  open: boolean
  onClose: () => void
}) {
  const [receita, setReceita] = useState<Receita | null>(null)
  const [itens, setItens] = useState<ReceitaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quimicos, setQuimicos] = useState<ProdutoQuimico[]>([])
  const [editDescricao, setEditDescricao] = useState("")
  const [editInstrucoes, setEditInstrucoes] = useState("")

  const [novoQuimicoId, setNovoQuimicoId] = useState("")
  const [novoDescricao, setNovoDescricao] = useState("")
  const [novoUnidade, setNovoUnidade] = useState("g/L")
  const [novoQtd, setNovoQtd] = useState("")
  const [novoEstagio, setNovoEstagio] = useState("A")

  const baseUrl = `/api/cadastros/produto-cru/${produtoCruId}/acabamentos/${acabamentoId}/amostras/${amostraId}/receitas`

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/cadastros/produtos-quimicos")
      .then(r => r.json())
      .then(setQuimicos)
      .catch(() => {})
    load()
  }, [open, amostraId])

  async function load() {
    try {
      const res = await fetch(baseUrl)
      const list: Receita[] = await res.json()
      if (list.length > 0) {
        const r = list[0]
        setReceita(r)
        setEditDescricao(r.descricao)
        setEditInstrucoes(r.instrucoes || "")
        const itRes = await fetch(`${baseUrl}/${r.id}/itens`)
        if (itRes.ok) setItens(await itRes.json())
      } else {
        setReceita(null)
        setEditDescricao("")
        setEditInstrucoes("")
        setItens([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function createReceita() {
    if (!editDescricao) { toast.error("Informe a descrição da receita"); return }
    setSaving(true)
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: editDescricao, instrucoes: editInstrucoes || null }),
      })
      if (!res.ok) throw new Error()
      const r = await res.json()
      setReceita(r)
      toast.success("Receita criada")
    } catch {
      toast.error("Erro ao criar receita")
    } finally {
      setSaving(false)
    }
  }

  async function updateReceita() {
    if (!receita) return
    setSaving(true)
    try {
      await fetch(`${baseUrl}/${receita.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: editDescricao, instrucoes: editInstrucoes || null }),
      })
      toast.success("Receita atualizada")
    } catch {
      toast.error("Erro ao atualizar")
    } finally {
      setSaving(false)
    }
  }

  async function addItem() {
    if (!receita || !novoQtd) { toast.error("Preencha a quantidade"); return }
    setSaving(true)
    try {
      const res = await fetch(`${baseUrl}/${receita.id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quimicoId: novoQuimicoId ? parseInt(novoQuimicoId) : null,
          descricao: novoDescricao || null,
          unidade: novoUnidade,
          quantidadeMetro: parseFloat(novoQtd),
          estagio: novoEstagio,
        }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setItens([...itens, item])
      setNovoDescricao("")
      setNovoQtd("")
      setNovoQuimicoId("")
      toast.success("Item adicionado")
    } catch {
      toast.error("Erro ao adicionar item")
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(itemId: number) {
    if (!receita) return
    try {
      await fetch(`${baseUrl}/${receita.id}/itens/${itemId}`, { method: "DELETE" })
      setItens(itens.filter(i => i.id !== itemId))
    } catch {
      toast.error("Erro ao remover item")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Receita de Beneficiamento</h2>
          <Button variant="ghost" onClick={onClose}>X</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Descrição da Receita</Label>
                  <Input value={editDescricao} onChange={e => setEditDescricao(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Instruções</Label>
                  <Textarea value={editInstrucoes} onChange={e => setEditInstrucoes(e.target.value)} />
                </div>
                <div>
                  {!receita ? (
                    <Button size="sm" onClick={createReceita} disabled={saving}>
                      <Plus size={14} className="mr-1" /> Criar Receita
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={updateReceita} disabled={saving}>
                      Salvar Receita
                    </Button>
                  )}
                </div>
              </div>

              {receita && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Itens da Receita</h3>
                    {itens.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {itens.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-sm">
                            <span>
                              <span className="font-mono text-xs text-slate-400 mr-1">[{item.estagio}]</span>
                              {item.quimicoNome || item.descricao || "Item"} —
                              {item.quantidadeMetro} {item.unidade}
                              {item.ordem > 0 && <span className="text-xs text-slate-400 ml-1">(ordem {item.ordem})</span>}
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-6 gap-2 items-end">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Produto Químico</Label>
                        <select value={novoQuimicoId} onChange={e => setNovoQuimicoId(e.target.value)}
                          className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm">
                          <option value="">Nenhum</option>
                          {quimicos.map(q => (
                            <option key={q.id} value={q.id}>{q.codigo} - {q.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Input size={4} value={novoDescricao} onChange={e => setNovoDescricao(e.target.value)} placeholder="ou manual" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unid.</Label>
                        <select value={novoUnidade} onChange={e => setNovoUnidade(e.target.value)}
                          className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm">
                          {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Qtd/m</Label>
                        <Input type="number" step="0.0001" value={novoQtd} onChange={e => setNovoQtd(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Estágio</Label>
                        <select value={novoEstagio} onChange={e => setNovoEstagio(e.target.value)}
                          className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm">
                          {ESTAGIOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <Button size="sm" className="mt-2" onClick={addItem} disabled={saving}>
                      <Plus size={14} className="mr-1" /> Adicionar Item
                    </Button>
                  </div>

                  {receita.instrucoes && (
                    <div className="border-t pt-3">
                      <h3 className="text-sm font-medium mb-1">Instruções</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{receita.instrucoes}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
