"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Database, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface BancoDados {
  id: number
  nome: string
  connectionString: string
  ativo: boolean
}

export default function BancoDadosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [lista, setLista] = useState<BancoDados[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState("")
  const [connectionString, setConnectionString] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config/banco-dados")
      .then(res => res.json())
      .then(setLista)
      .catch(() => toast.error("Erro ao carregar conexões"))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    if (!nome || !connectionString) {
      toast.error("Nome e string de conexão são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config/banco-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, connectionString }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setLista(prev => [...prev, item])
      setNome("")
      setConnectionString("")
      setShowForm(false)
      toast.success("Conexão adicionada!")
    } catch {
      toast.error("Erro ao adicionar conexão")
    } finally {
      setSaving(false)
    }
  }

  async function handleAtivar(item: BancoDados) {
    try {
      const res = await fetch("/api/admin/config/banco-dados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ativo: true }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.map(c => ({ ...c, ativo: c.id === item.id })))
      toast.success(`"${item.nome}" definido como ativo`)
    } catch {
      toast.error("Erro ao ativar conexão")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover esta conexão?")) return
    try {
      const res = await fetch("/api/admin/config/banco-dados", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.filter(c => c.id !== id))
      toast.success("Conexão removida")
    } catch {
      toast.error("Erro ao remover conexão")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Banco de Dados{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Gerencie as conexões com banco de dados</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {lista.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">Nenhuma conexão cadastrada</p>
          ) : (
            lista.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {item.ativo ? (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                      <Check size={16} />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                      <Database size={16} />
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.nome}</p>
                    <p className="text-xs text-slate-500 font-mono truncate max-w-md">{item.connectionString}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!item.ativo && (
                    <Button size="sm" variant="outline" onClick={() => handleAtivar(item)} className="gap-1">
                      <Check size={14} /> Ativar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} className="gap-1 text-red-600">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Nova Conexão</h2>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Produção Neon" />
          </div>
          <div className="space-y-2">
            <Label>String de Conexão</Label>
            <Input value={connectionString} onChange={e => setConnectionString(e.target.value)} placeholder="postgresql://user:pass@host:5432/db" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={saving} className="gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Adicionar
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setNome(""); setConnectionString("") }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} /> Nova Conexão
        </Button>
      )}

      <p className="text-xs text-slate-400">
        * A alteração do banco ativo requer reinicialização do servidor para aplicar.
      </p>
    </div>
  )
}
