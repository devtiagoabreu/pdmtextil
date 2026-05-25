"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Mail, Send, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

export default function SmtpConfigPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [host, setHost] = useState("smtp.gmail.com")
  const [port, setPort] = useState("587")
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [fromName, setFromName] = useState("PDM Têxtil")
  const [ativo, setAtivo] = useState(true)

  const [testEmail, setTestEmail] = useState("")
  const [testing, setTesting] = useState(false)
  const [hasConfig, setHasConfig] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config/smtp")
      .then(res => res.json())
      .then(data => {
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
      .catch(() => {})
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
      if (res.ok) {
        toast.success(data.message || "Email de teste enviado!")
      } else {
        toast.error(data.error || "Falha ao enviar teste")
      }
    } catch {
      toast.error("Erro ao enviar email de teste")
    } finally {
      setTesting(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("Limpar configuração de email?")) return
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Mail className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">SMTP{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Configuração do servidor de email</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Configuração de Email (SMTP)</h2>
        </div>
        <p className="text-sm text-slate-500">
          Configure o servidor SMTP para envio de emails. Para Gmail, use a senha de app gerada em <strong>Conta Google &gt; Segurança &gt; Senhas de app</strong>.
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
      </div>

      {hasConfig && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Testar Envio</h2>
          <p className="text-sm text-slate-500">Envie um email de teste para verificar se a configuração está funcionando.</p>
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
