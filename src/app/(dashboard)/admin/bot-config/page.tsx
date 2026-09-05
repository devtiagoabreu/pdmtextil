"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Save, Bot, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface UsuarioItem {
  id: number
  name: string
  email: string
  role: string
  ativo: boolean
  celWhatsapp: string | null
}

interface BotConfig {
  pj: number[]
  pf: number[]
  usuarios: UsuarioItem[]
}

export default function BotConfigAdminPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [config, setConfig] = useState<BotConfig>({ pj: [], pf: [], usuarios: [] })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data, isLoading: loading, isError } = useQuery<BotConfig>({
    queryKey: ["admin-bot-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bot-config")
      if (!res.ok) throw new Error("Erro HTTP")
      return res.json()
    },
  })

  useEffect(() => {
    if (data) setConfig(data)
  }, [data])

  useEffect(() => {
    if (isError) toast.error("Erro ao carregar configuração do bot")
  }, [isError])

  const ativos = config.usuarios.filter(u => u.ativo)
  const inativos = config.usuarios.filter(u => !u.ativo)

  function toggle(tipo: "pj" | "pf", id: number) {
    setConfig(prev => {
      const lista = prev[tipo]
      const mudou = lista.includes(id)
        ? lista.filter(x => x !== id)
        : [...lista, id]
      return { ...prev, [tipo]: mudou }
    })
    setDirty(true)
  }

  async function salvar() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pj: config.pj, pf: config.pf }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao salvar")
      }
      toast.success("Configuração do bot salva!")
      setDirty(false)
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  function Card({ tipo, titulo, descricao }: { tipo: "pj" | "pf"; titulo: string; descricao: string }) {
    const selecionados = config[tipo]
    return (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <header className="border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{titulo}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{descricao}</p>
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
            {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
          </span>
        </header>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {ativos.map(usuario => {
            const marcado = selecionados.includes(usuario.id)
            return (
              <label
                key={usuario.id}
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => toggle(tipo, usuario.id)}
                  className="h-4 w-4 accent-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{usuario.name}</p>
                  <p className="text-xs text-slate-500 truncate">{usuario.email}</p>
                </div>
                {usuario.celWhatsapp ? (
                  <span className="text-xs text-slate-500 shrink-0" title="Possui número de WhatsApp cadastrado">
                    WhatsApp ✓
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 shrink-0">sem WhatsApp</span>
                )}
              </label>
            )
          })}
        </div>

        {inativos.length > 0 && (
          <footer className="border-t border-slate-100 dark:border-slate-800 px-5 py-3">
            <p className="text-xs text-slate-400">
              {inativos.length} usuário{inativos.length === 1 ? "" : "s"} inativo{inativos.length === 1 ? "" : "s"} oculto{inativos.length === 1 ? "" : "s"}
            </p>
          </footer>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Bot className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Config Bot WhatsApp{info && <InfoButton content={info} />}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quem recebe o contato quando o bot identifica uma nova pessoa física ou jurídica
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          tipo="pf"
          titulo="Pessoa Física (PF)"
          descricao="Recebe o contato quando o lead é pessoa física"
        />
        <Card
          tipo="pj"
          titulo="Pessoa Jurídica (PJ)"
          descricao="Recebe o contato quando o lead é pessoa jurídica (CNPJ)"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>
    </div>
  )
}