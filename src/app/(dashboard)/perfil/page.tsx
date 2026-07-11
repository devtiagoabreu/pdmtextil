"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { User, LogOut, Settings, Key, Loader2, Eye, EyeOff, Shuffle, Menu, ExternalLink, Mail, CheckCircle2, XCircle } from "lucide-react"
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

function UserSmtpConfig() {
  const [email, setEmail] = useState("")
  const [senhaApp, setSenhaApp] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasConfig, setHasConfig] = useState(false)

  useEffect(() => {
    fetch("/api/user/email-config")
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setEmail(data.config.email)
          setSenhaApp(data.config.senhaApp)
          setHasConfig(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senhaApp) {
      toast.error("Email e senha do app são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/user/email-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha_app: senhaApp }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar")
      toast.success("Configuração de email salva com sucesso!")
      setHasConfig(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemover = async () => {
    if (!confirm("Remover sua configuração de email?")) return
    try {
      const res = await fetch("/api/user/email-config", { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao remover")
      setEmail("")
      setSenhaApp("")
      setHasConfig(false)
      toast.success("Configuração removida")
    } catch {
      toast.error("Erro ao remover")
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  return (
    <form onSubmit={handleSalvar} className="space-y-4">
      {hasConfig && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 size={16} />
          Você já possui uma configuração de email cadastrada.
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Seu Email</label>
        <Input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seuemail@gmail.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Senha de App do Gmail</label>
        <div className="relative">
          <Input
            type={showSenha ? "text" : "password"}
            value={senhaApp}
            onChange={e => setSenhaApp(e.target.value)}
            placeholder="senha de app do Gmail"
            required
          />
          <button
            type="button"
            onClick={() => setShowSenha(!showSenha)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use uma <strong>Senha de App</strong> do Gmail (Gerar em: Conta Google &rarr; Seguran&ccedil;a &rarr; Senhas de app).
          O email ser&aacute; enviado como <strong>{email || "seuemail@gmail.com"}</strong>.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {hasConfig ? "Atualizar" : "Salvar"}
        </Button>
        {hasConfig && (
          <Button type="button" variant="outline" onClick={handleRemover} className="gap-2 text-red-500">
            <XCircle size={16} /> Remover
          </Button>
        )}
      </div>
    </form>
  )
}

export default function PerfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
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
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil{info && <InfoButton content={info} />}</h1>
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
            <Menu className="w-5 h-5" />
            Menu de Navegação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Personalize os menus do nav e escolha sua página inicial.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push("/perfil/menus")} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Configurar Menus
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuração de Email para Disparos em Massa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configure seu próprio SMTP para enviar emails em massa com seu remetente pessoal.
            Basta informar seu email e a senha de app do Gmail. As notificações do sistema continuam usando o SMTP padrão.
          </p>
          <UserSmtpConfig />
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
