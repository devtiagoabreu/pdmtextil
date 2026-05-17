"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react"
import Link from "next/link"

interface Role {
  id: number
  name: string
  label: string
  ativo: boolean
}

interface Usuario {
  id: number
  email: string
  name: string
  role: string
  ativo: boolean
  ultimoAcesso: string | null
  createdAt: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [showNovo, setShowNovo] = useState(false)
  const [novoEmail, setNovoEmail] = useState("")
  const [novoNome, setNovoNome] = useState("")
  const [novoPassword, setNovoPassword] = useState("")
  const [novoRole, setNovoRole] = useState("COMERCIAL")
  const [saving, setSaving] = useState(false)

  const fetchUsuarios = async () => {
    try {
      const [usuariosRes, rolesRes] = await Promise.all([
        fetch("/api/admin/usuarios"),
        fetch("/api/admin/roles"),
      ])
      if (usuariosRes.ok) setUsuarios(await usuariosRes.json())
      if (rolesRes.ok) setRoles(await rolesRes.json())
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const handleCreate = async () => {
    if (!novoEmail || !novoNome || !novoPassword) {
      toast.error("Preencha email, nome e senha")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: novoEmail, name: novoNome, password: novoPassword, role: novoRole }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar")
      }
      toast.success("Usuário criado!")
      setShowNovo(false)
      setNovoEmail("")
      setNovoNome("")
      setNovoPassword("")
      setNovoRole("COMERCIAL")
      fetchUsuarios()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Excluir usuário "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao excluir")
      }
      toast.success("Usuário excluído!")
      fetchUsuarios()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filtered = usuarios.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Usuários</h1>
          <p className="text-sm text-slate-500 mt-1">Gerenciar usuários e permissões do sistema</p>
        </div>
        <Button onClick={() => setShowNovo(true)} className="gap-2">
          <Plus size={16} /> Novo Usuário
        </Button>
      </div>

      {showNovo && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="font-semibold">Novo Usuário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={novoEmail} onChange={e => setNovoEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input type="password" value={novoPassword} onChange={e => setNovoPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <select value={novoRole} onChange={e => setNovoRole(e.target.value)}
                className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                {roles.filter(r => r.ativo).map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Criar
            </Button>
            <Button variant="outline" onClick={() => setShowNovo(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-center p-8">Nenhum usuário encontrado</p>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Nome</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Email</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Perfil</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Último Acesso</th>
                <th className="text-right p-3 text-sm font-medium text-slate-600 dark:text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-3 text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="p-3">
                    <span className="inline-block rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">
                      {roles.find(r => r.name === u.role)?.label || u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-500">
                    {u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/usuarios/${u.id}`)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.name)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
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
