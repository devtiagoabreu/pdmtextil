"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, Key, Loader2, Eye, EyeOff, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function gerarSenha(): string {
  const maiusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const minusculas = "abcdefghijklmnopqrstuvwxyz"
  const numeros = "0123456789"
  const especial = "!@#$%&*"
  const tudo = maiusculas + minusculas + numeros + especial
  let senha = ""
  senha += maiusculas[Math.floor(Math.random() * maiusculas.length)]
  senha += minusculas[Math.floor(Math.random() * minusculas.length)]
  senha += numeros[Math.floor(Math.random() * numeros.length)]
  senha += especial[Math.floor(Math.random() * especial.length)]
  for (let i = 0; i < 8; i++) {
    senha += tudo[Math.floor(Math.random() * tudo.length)]
  }
  return senha.split("").sort(() => Math.random() - 0.5).join("")
}

export default function PerfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [saving, setSaving] = useState(false)

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const user = session.user

  const handleGerarSenha = () => {
    const nova = gerarSenha()
    setSenha(nova)
    setConfirmar(nova)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres")
      return
    }
    if (senha !== confirmar) {
      toast.error("As senhas não conferem")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/perfil/senha", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar senha")
      }
      toast.success("Senha alterada com sucesso!")
      setSenha("")
      setConfirmar("")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle>{user?.name || "Usuário"}</CardTitle>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Perfil</p>
              <p className="font-medium">{(user as any)?.role || "Usuário"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium text-green-600">Ativo</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Senha</label>
              <div className="relative">
                <Input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Nova Senha</label>
              <Input
                type={mostrarSenha ? "text" : "password"}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Digite a senha novamente"
                minLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !senha || !confirmar} className="gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                Salvar Senha
              </Button>
              <Button type="button" variant="outline" onClick={handleGerarSenha} className="gap-2">
                <Shuffle size={16} />
                Gerar Senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
