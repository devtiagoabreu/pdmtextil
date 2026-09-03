"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { User, LogOut, Settings, Key, Loader2, Eye, EyeOff, Shuffle, Menu, ExternalLink, Mail, Send, Trash2, XCircle, CheckCircle2 } from "lucide-react"
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
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [saving, setSaving] = useState(false)

  const [emailConfig, setEmailConfig] = useState<{
    email: string
    ativo: boolean
    limiteDiario: number
    hasPassword: boolean
  } | null>(null)
  const [emailLoading, setEmailLoading] = useState(true)
  const [emailInput, setEmailInput] = useState("")
  const [senhaApp, setSenhaApp] = useState("")
  const [limiteDiario, setLimiteDiario] = useState("1500")
  const [ativo, setAtivo] = useState(true)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailTesting, setEmailTesting] = useState(false)
  const [emailDeleting, setEmailDeleting] = useState(false)

  useEffect(() => {
    fetch("/api/user/email-config")
      .then(res => res.json())
      .then(data => {
        const cfg = data?.config
        if (cfg) {
          setEmailConfig(cfg)
          setEmailInput(cfg.email || "")
          setAtivo(cfg.ativo ?? true)
          setLimiteDiario(String(cfg.limiteDiario ?? 1500))
        } else {
          setEmailConfig(null)
        }
      })
      .catch(console.error)
      .finally(() => setEmailLoading(false))
  }, [])

  const handleSalvarEmail = async () => {
    if (!emailInput) {
      toast.error("Informe o email de envio")
      return
    }
    if (!emailConfig && !senhaApp) {
      toast.error("Informe a senha de app para criar a configuração")
      return
    }
    const limite = Number(limiteDiario)
    if (!Number.isInteger(limite) || limite < 100 || limite > 50000) {
      toast.error("Limite diário deve ser um número entre 100 e 50000")
      return
    }
    setEmailSaving(true)
    try {
      const res = await fetch("/api/user/email-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          senha_app: senhaApp || undefined,
          limite_diario: limite,
          ativo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")
      setEmailConfig({ email: emailInput, ativo, limiteDiario: limite, hasPassword: emailConfig ? emailConfig.hasPassword : true })
      setSenhaApp("")
      toast.success("Configuração de email salva!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEmailSaving(false)
    }
  }

  const handleTestarEmail = async () => {
    if (!emailInput || !senhaApp) {
      toast.error("Preencha email e senha de app para testar a conexão")
      return
    }
    setEmailTesting(true)
    try {
      const res = await fetch("/api/user/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, senha_app: senhaApp }),
      })
      const data = await res.json()
      if (data.success) toast.success(data.message || "Conexão SMTP realizada com sucesso")
      else toast.error(data.error || "Falha ao conectar ao SMTP")
    } catch (err: any) {
      toast.error(err.message || "Erro ao testar conexão")
    } finally {
      setEmailTesting(false)
    }
  }

  const handleRemoverEmail = async () => {
    if (!confirm("Remover sua configuração de email de envio em massa?")) return
    setEmailDeleting(true)
    try {
      await fetch("/api/user/email-config", { method: "DELETE" })
      setEmailConfig(null)
      setEmailInput("")
      setSenhaApp("")
      setLimiteDiario("1500")
      setAtivo(true)
      toast.success("Configuração de email removida")
    } catch {
      toast.error("Erro ao remover configuração")
    } finally {
      setEmailDeleting(false)
    }
  }

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
          <Link
            href="/perfil/menus"
            className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-7 gap-2 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5"
          >
            <ExternalLink className="w-4 h-4" />
            Configurar Menus
          </Link>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email de Envio em Massa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {emailConfig?.ativo === false ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400"><XCircle size={14} /> Inativo</span>
                ) : emailConfig ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={14} /> Ativo</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">Não configurado</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email de envio *</label>
                <Input
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="seuemail@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Senha de App {emailConfig?.hasPassword ? "(vazia mantém a atual)" : "*"}
                </label>
                <Input
                  type="password"
                  value={senhaApp}
                  onChange={e => setSenhaApp(e.target.value)}
                  placeholder="Senha de app do Gmail"
                />
                <p className="text-xs text-muted-foreground">
                  Para Gmail, use uma senha de app criada em Conta Google &gt; Segurança &gt; Senhas de app.
                  Usada como remetente do email em massa quando o envio é <strong>&quot;Meu Email&quot;</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Limite diário</label>
                <Input
                  type="number"
                  min={100}
                  max={50000}
                  step={100}
                  value={limiteDiario}
                  onChange={e => setLimiteDiario(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Máximo de emails enviados por este remetente a cada 24 horas.</p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="emailAtivo" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="emailAtivo" className="text-sm">Configuração ativa</label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSalvarEmail} disabled={emailSaving} className="gap-2">
                  {emailSaving && <Loader2 size={16} className="animate-spin" />}
                  Salvar
                </Button>
                <Button onClick={handleTestarEmail} disabled={emailTesting || !emailConfig && !senhaApp} variant="outline" className="gap-2">
                  {emailTesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Testar conexão
                </Button>
                {emailConfig && (
                  <Button onClick={handleRemoverEmail} disabled={emailDeleting} variant="outline" className="gap-2 text-red-600">
                    {emailDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Remover
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
