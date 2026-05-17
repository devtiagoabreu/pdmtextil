"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Loader2, Pencil } from "lucide-react"

interface Role {
  id: number
  name: string
  label: string
  description: string | null
  permissions: Record<string, unknown>
  ativo: boolean
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles")
      if (res.ok) setRoles(await res.json())
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoles() }, [])

  const resetForm = () => {
    setShowForm(false)
    setEditId(null)
    setName("")
    setLabel("")
    setDescription("")
  }

  const handleSave = async () => {
    if (!name || !label) { toast.error("Nome e label são obrigatórios"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, label, description }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro")
      }
      toast.success("Role criada!")
      resetForm()
      fetchRoles()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Perfis de Acesso (Roles)</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os perfis do sistema. Eles aparecem no cadastro de usuários.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }} className="gap-2">
          <Plus size={16} /> Nova Role
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="font-semibold">{editId ? "Editar" : "Nova"} Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome (código) *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="EX: SUPERVISOR" />
              <p className="text-xs text-slate-400">Será convertido para maiúsculas. Use para referência no sistema.</p>
            </div>
            <div className="space-y-2">
              <Label>Label (exibição) *</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Supervisor" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="O que este perfil pode fazer?" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editId ? "Salvar" : "Criar"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Nome</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Label</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Descrição</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-3 text-sm font-mono font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                  <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{r.label}</td>
                  <td className="p-3 text-sm text-slate-500">{r.description || "—"}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {r.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
