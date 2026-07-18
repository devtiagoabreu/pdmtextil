"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Mail, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

export default function CrmEmailConfigPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
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
      .then(res => res.json())
      .then(data => {
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Mail className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Email CRM{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Configuração de email para pesquisas de satisfação do CRM</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Email Padrão CRM</h2>
        </div>
        <p className="text-sm text-slate-500">
          Configure o servidor SMTP para envio automático de pesquisas de satisfação e outros emails do CRM. Para Gmail, use a senha de app gerada em <strong>Conta Google &gt; Segurança &gt; Senhas de app</strong>.
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
    </div>
  )
}
