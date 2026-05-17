"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const ROLES = ["COMERCIAL", "TECELAGEM", "BENEFICIAMENTO", "PCP", "ADMIN"]

export default function EditarUsuarioPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params.id as string)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("COMERCIAL")
  const [ativo, setAtivo] = useState(true)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/usuarios/${id}`)
      .then(res => res.json())
      .then(data => {
        setName(data.name || "")
        setEmail(data.email || "")
        setRole(data.role || "COMERCIAL")
        setAtivo(data.ativo ?? true)
      })
      .catch(() => toast.error("Erro ao carregar usuário"))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!name || !email) {
      toast.error("Nome e email são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name, email, role, ativo }
      if (password.length >= 6) body.password = password

      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      toast.success("Usuário atualizado!")
      router.push("/admin/usuarios")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/usuarios">
          <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Editar Usuário</h1>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Perfil (Role)</Label>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Usuário Ativo</Label>
        </div>
        <div className="space-y-2">
          <Label>Nova Senha (deixe em branco para manter)</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Salvar
          </Button>
          <Link href="/admin/usuarios">
            <Button variant="outline">Cancelar</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
