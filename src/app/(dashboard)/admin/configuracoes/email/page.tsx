"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Mail, Send, Trash2, ArrowLeft, Plus, Pencil, XCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { matchesSearch } from "@/components/ui/list-filters"

interface SmtpConfig {
  id: number
  host: string
  port: number
  user: string
  pass: string
  fromName: string
  ativo: boolean
}

interface CrmEmailConfig {
  id: number
  host: string
  port: number
  user: string
  pass: string
  fromName: string
  replyTo: string
  ativo: boolean
}

interface UsuarioEmail {
  id: number
  usuarioId: number
  email: string
  host: string
  port: number
  ativo: boolean
  limiteDiario: number
  usuarioNome: string
  usuarioEmail: string
}

interface Usuario {
  id: number
  email: string
  name: string
  role: string
}

export default function EmailConfigPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [activeTab, setActiveTab] = useState("sistema")

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Mail className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Configuração de Email{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">SMTP do sistema, email por usuário e email do CRM em um só lugar</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col space-y-6">
        <TabsList variant="line" className="w-full border-b">
          <TabsTrigger value="sistema">SMTP Sistema</TabsTrigger>
          <TabsTrigger value="usuarios">Email por Usuário</TabsTrigger>
          <TabsTrigger value="crm">SMTP CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="sistema" className="w-full m-0 border-0 p-0 shadow-none">
          <SistemaSmtp />
        </TabsContent>
        <TabsContent value="usuarios" className="w-full m-0 border-0 p-0 shadow-none">
          <UsuariosEmail />
        </TabsContent>
        <TabsContent value="crm" className="w-full m-0 border-0 p-0 shadow-none">
          <CrmSmtp />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SistemaSmtp() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [host, setHost] = useState("smtp.gmail.com")
  const [port, setPort] = useState("587")
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [fromName, setFromName] = useState("PDM Têxtil")
  const [ativo, setAtivo] = useState(true)
  const [hasConfig, setHasConfig] = useState(false)

  const [testEmail, setTestEmail] = useState("")
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config/smtp")
      .then((res: any) => res.json())
      .then((data: any) => {
        if (data && data.id) {
          setHost(data.host || "smtp.gmail.com")
          setPort(String(data.port || 587))
          setUser(data.user || "")
          setPass(data.pass || "")
          setFromName(data.fromName || "PDM Têxtil")
          setAtivo(data.ativo ?? true)
          setHasConfig(true)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!user || !pass) {
      toast.error("Email e senha de app são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port: parseInt(port), user, pass, fromName, ativo }),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuração salva!")
      setHasConfig(true)
    } catch {
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testEmail) {
      toast.error("Informe o email de destino para o teste")
      return
    }
    setTesting(true)
    try {
      const res = await fetch("/api/admin/config/email-teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      })
      const data = await res.json()
      if (res.ok) toast.success(data.message || "Email de teste enviado!")
      else toast.error(data.error || "Falha ao enviar teste")
    } catch {
      toast.error("Erro ao enviar email de teste")
    } finally {
      setTesting(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("Limpar configuração de email do sistema?")) return
    try {
      await fetch("/api/admin/config/smtp", { method: "DELETE" })
      setHost("smtp.gmail.com")
      setPort("587")
      setUser("")
      setPass("")
      setFromName("PDM Têxtil")
      setAtivo(true)
      setHasConfig(false)
      toast.success("Configuração removida")
    } catch {
      toast.error("Erro ao remover configuração")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Mail size={20} className="text-blue-600" />
        <h2 className="text-lg font-semibold">SMTP Padrão do Sistema</h2>
      </div>
      <p className="text-sm text-slate-500">
        Usado pelas <strong>notificações do sistema</strong>, menções no chat e envio em massa com remetente <strong>sistema</strong>. Para Gmail, use a senha de app gerada em <strong>Conta Google &gt; Segurança &gt; Senhas de app</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Servidor SMTP</Label>
          <Input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.gmail.com" />
        </div>
        <div className="space-y-2">
          <Label>Porta</Label>
          <Input value={port} onChange={e => setPort(e.target.value)} placeholder="587" />
        </div>
        <div className="space-y-2">
          <Label>Email de envio *</Label>
          <Input value={user} onChange={e => setUser(e.target.value)} placeholder="seuemail@gmail.com" />
        </div>
        <div className="space-y-2">
          <Label>Senha de App *</Label>
          <Input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha de app do Gmail" />
        </div>
        <div className="space-y-2">
          <Label>Nome do Remetente</Label>
          <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="PDM Têxtil" />
        </div>
        <div className="flex items-end gap-2">
          <input type="checkbox" id="smtpAtivo" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4 mb-2" />
          <Label htmlFor="smtpAtivo">Configuração ativa</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Salvar
        </Button>
        {hasConfig && (
          <Button variant="outline" onClick={handleClear} className="gap-2 text-red-600">
            <Trash2 size={16} /> Limpar
          </Button>
        )}
      </div>

      {hasConfig && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
          <h3 className="text-sm font-semibold mb-2">Testar Envio</h3>
          <div className="flex gap-2 items-end">
            <div className="space-y-2 flex-1">
              <Label>Email de destino</Label>
              <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="teste@exemplo.com" />
            </div>
            <Button onClick={handleTest} disabled={testing} variant="outline" className="gap-2">
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Testar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function UsuariosEmail() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: configs = [], isLoading: loading } = useQuery<UsuarioEmail[]>({
    queryKey: ["admin-user-email"],
    queryFn: async () => {
      const res = await fetch("/api/admin/config/user-email")
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["admin-usuarios"],
    queryFn: async () => {
      const res = await fetch("/api/admin/usuarios")
      if (!res.ok) return []
      return res.json()
    },
  })

  const edited = new Set(configs.map(c => c.usuarioId))

  const filtered = configs
    .filter(c => matchesSearch(c.usuarioNome + " " + c.email, search))

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Mail size={20} className="text-blue-600" />
        <h2 className="text-lg font-semibold">Email por Usuário (Envio em Massa)</h2>
      </div>
      <p className="text-sm text-slate-500">
        Configure o SMTP pessoal de cada usuário, usado no envio em massa quando o remetente é o <strong>usuário</strong>.
      </p>

      <div className="mb-2">
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">Nenhum usuário com configuração de email cadastrada.</p>
        )}
        {filtered.map(c => (
          <UsuarioEmailRow key={c.id} config={c} onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-user-email"] })} />
        ))}
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Plus size={16} /> Novo cadastro por usuário</h3>
        <p className="text-sm text-slate-500 mb-2">
          {usuarios.length - edited.size > 0
            ? `Existem ${usuarios.length - edited.size} usuários sem configuração.`
            : "Todos os usuários já possuem configuração."}
        </p>
        <NovoUsuarioEmail usuarios={usuarios} edited={edited} onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-user-email"] })} />
      </div>
    </div>
  )
}

function UsuarioEmailRow({ config, onSaved }: { config: UsuarioEmail; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(config.email)
  const [senhaApp, setSenhaApp] = useState("")
  const [limiteDiario, setLimiteDiario] = useState(String(config.limiteDiario ?? 1500))
  const [ativo, setAtivo] = useState(config.ativo ?? true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config/user-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: config.usuarioId,
          email,
          senhaApp: senhaApp || undefined,
          limiteDiario: Number(limiteDiario),
          ativo,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuração atualizada!")
      setEditing(false)
      setSenhaApp("")
      onSaved()
    } catch {
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Remover a configuração de email de ${config.usuarioNome}?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/config/user-email?usuarioId=${config.usuarioId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Configuração removida")
      onSaved()
    } catch {
      toast.error("Erro ao remover configuração")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{config.usuarioNome}</p>
          <p className="text-xs text-slate-500">{config.email}</p>
        </div>
        <div className="flex items-center gap-1">
          {ativo ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={14} /> Ativo</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400"><XCircle size={14} /> Inativo</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} className="gap-1">
            <Pencil size={16} /> Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1 text-red-600">
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </Button>
        </div>
      </div>

      {editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Senha de App (vazia mantém a atual)</Label>
            <Input type="password" value={senhaApp} onChange={e => setSenhaApp(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Limite Diário</Label>
            <Input type="number" min={100} max={50000} step={100} value={limiteDiario} onChange={e => setLimiteDiario(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <input type="checkbox" id={`ativo-${config.usuarioId}`} checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4" />
            <Label htmlFor={`ativo-${config.usuarioId}`} className="text-xs">Configuração ativa</Label>
          </div>
          <div className="col-span-full flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function NovoUsuarioEmail({ usuarios, edited, onSaved }: { usuarios: Usuario[]; edited: Set<number>; onSaved: () => void }) {
  const [usuarioId, setUsuarioId] = useState("")
  const [email, setEmail] = useState("")
  const [senhaApp, setSenhaApp] = useState("")
  const [limiteDiario, setLimiteDiario] = useState("1500")
  const [saving, setSaving] = useState(false)

  const disponiveis = usuarios.filter(u => !edited.has(u.id))

  const handleSave = async () => {
    if (!usuarioId || !email || !senhaApp) {
      toast.error("Selecione o usuário e preencha email e senha de app")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config/user-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: Number(usuarioId), email, senhaApp, limiteDiario: Number(limiteDiario) }),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuração cadastrada!")
      setUsuarioId("")
      setEmail("")
      setSenhaApp("")
      setLimiteDiario("1500")
      onSaved()
    } catch {
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Usuário *</Label>
        <select
          value={usuarioId}
          onChange={e => setUsuarioId(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Selecione...</option>
          {disponiveis.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Email de envio *</Label>
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@gmail.com" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Senha de App *</Label>
        <Input type="password" value={senhaApp} onChange={e => setSenhaApp(e.target.value)} placeholder="Senha de app do Gmail" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Limite Diário</Label>
        <Input type="number" min={100} max={50000} step={100} value={limiteDiario} onChange={e => setLimiteDiario(e.target.value)} />
      </div>
      <div className="col-span-full">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          {saving && <Loader2 size={16} className="animate-spin" />}
          <Plus size={16} /> Cadastrar
        </Button>
      </div>
    </div>
  )
}

function CrmSmtp() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [host, setHost] = useState("smtp.gmail.com")
  const [port, setPort] = useState("587")
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [fromName, setFromName] = useState("PDM PRO TEXTIL - CRM")
  const [replyTo, setReplyTo] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [hasConfig, setHasConfig] = useState(false)

  useEffect(() => {
    fetch("/api/crm/config/email")
      .then((res: any) => res.json())
      .then((data: any) => {
        if (data && data.id) {
          setHost(data.host || "smtp.gmail.com")
          setPort(String(data.port || 587))
          setUser(data.user || "")
          setPass(data.pass || "")
          setFromName(data.fromName || "PDM PRO TEXTIL - CRM")
          setReplyTo(data.replyTo || "")
          setAtivo(data.ativo ?? true)
          setHasConfig(true)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!user || !pass) {
      toast.error("Email e senha de app são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/config/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port: parseInt(port), user, pass, fromName, replyTo, ativo }),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuração CRM salva!")
      setHasConfig(true)
    } catch {
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("Limpar configuração de email CRM?")) return
    try {
      await fetch("/api/crm/config/email", { method: "DELETE" })
      setHost("smtp.gmail.com")
      setPort("587")
      setUser("")
      setPass("")
      setFromName("PDM PRO TEXTIL - CRM")
      setReplyTo("")
      setAtivo(true)
      setHasConfig(false)
      toast.success("Configuração removida")
    } catch {
      toast.error("Erro ao remover configuração")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Mail size={20} className="text-cyan-600" />
        <h2 className="text-lg font-semibold">SMTP CRM</h2>
      </div>
      <p className="text-sm text-slate-500">
        Usado para envio automático de <strong>pesquisas de satisfação</strong> e outros emails do CRM. Se não configurado, usa o SMTP do sistema.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Servidor SMTP</Label>
          <Input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.gmail.com" />
        </div>
        <div className="space-y-2">
          <Label>Porta</Label>
          <Input value={port} onChange={e => setPort(e.target.value)} placeholder="587" />
        </div>
        <div className="space-y-2">
          <Label>Email de envio *</Label>
          <Input value={user} onChange={e => setUser(e.target.value)} placeholder="crm@seudominio.com" />
        </div>
        <div className="space-y-2">
          <Label>Senha de App *</Label>
          <Input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha de app do Gmail" />
        </div>
        <div className="space-y-2">
          <Label>Nome do Remetente</Label>
          <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="PDM PRO TEXTIL - CRM" />
        </div>
        <div className="space-y-2">
          <Label>Email de Resposta (Reply-To)</Label>
          <Input value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="comercial@seudominio.com" />
        </div>
        <div className="flex items-end gap-2">
          <input type="checkbox" id="crmAtivo" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4 mb-2" />
          <Label htmlFor="crmAtivo">Configuração ativa</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Salvar
        </Button>
        {hasConfig && (
          <Button variant="outline" onClick={handleClear} className="gap-2 text-red-600">
            <Trash2 size={16} /> Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
