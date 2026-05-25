"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Save, Bell, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface Regra {
  tipo: string
  roles: string[]
}

const ALL_ROLES = ["COMERCIAL", "DESENVOLVIMENTO", "ADMIN", "SUDO", "QUALIDADE", "TECELAGEM", "BENEFICIAMENTO", "PCP"]

const TIPO_LABEL: Record<string, string> = {
  SOLICITACAO_CRIADA: "Solicitação Criada",
  SOLICITACAO_APROVADA: "Solicitação Aprovada",
  SOLICITACAO_REPROVADA: "Solicitação Reprovada",
  SOLICITACAO_ATUALIZADA: "Solicitação Atualizada",
  PRODUTO_CRU_CRIADO: "Produto Cru Criado",
  PRODUTO_CRU_ATUALIZADO: "Produto Cru Atualizado",
  PRODUTO_CRU_EXCLUIDO: "Produto Cru Excluído",
  AMOSTRA_CRIADA: "Amostra Criada",
  AMOSTRA_APROVADA: "Amostra Aprovada",
  AMOSTRA_REPROVADA: "Amostra Reprovada",
  AMOSTRA_ATUALIZADA: "Amostra Atualizada",
  AMOSTRA_EXCLUIDA: "Amostra Excluída",
  ACABAMENTO_CRIADO: "Acabamento Criado",
  ACABAMENTO_EXCLUIDO: "Acabamento Excluído",
}

export default function NotificacoesAdminPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [regras, setRegras] = useState<Regra[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch("/api/admin/notificacao-regras")
      .then(res => { if (!res.ok) throw new Error("Erro HTTP"); return res.json() })
      .then((d: { regras: Regra[] }) => setRegras(d.regras ?? []))
      .catch(() => toast.error("Erro ao carregar regras de notificação"))
      .finally(() => setLoading(false))
  }, [])

  function toggleRole(tipo: string, role: string) {
    setRegras(prev => prev.map(r => {
      if (r.tipo !== tipo) return r
      const next = r.roles.includes(role)
        ? r.roles.filter(x => x !== role)
        : [...r.roles, role]
      return { ...r, roles: next }
    }))
    setDirty(true)
  }

  function selectAll(tipo: string, checked: boolean) {
    setRegras(prev => prev.map(r => {
      if (r.tipo !== tipo) return r
      return { ...r, roles: checked ? [...ALL_ROLES] : [] }
    }))
    setDirty(true)
  }

  async function salvar() {
    setSaving(true)
    try {
      for (const regra of regras) {
        const res = await fetch("/api/admin/notificacao-regras", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: regra.tipo, roles: regra.roles }),
        })
        if (!res.ok) throw new Error(`Erro ao salvar regra ${regra.tipo}`)
      }
      toast.success("Regras de notificação salvas!")
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Bell className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Notificações por Tipo{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Selecione quais perfis recebem notificação para cada tipo de evento</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <th className="p-3 text-left font-semibold text-slate-700 dark:text-slate-300 min-w-[180px]">Tipo de Notificação</th>
              {ALL_ROLES.map(role => (
                <th key={role} className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regras.map(regra => (
              <tr key={regra.tipo} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{TIPO_LABEL[regra.tipo] || regra.tipo}</span>
                    <input
                      type="checkbox"
                      checked={regra.roles.length === ALL_ROLES.length}
                      onChange={e => selectAll(regra.tipo, e.target.checked)}
                      title="Marcar/desmarcar todas"
                      className="h-3.5 w-3.5 accent-blue-600 ml-2"
                    />
                  </div>
                </td>
                {ALL_ROLES.map(role => (
                  <td key={role} className="p-2 text-center">
                    <label className="flex items-center justify-center w-8 h-8 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mx-auto">
                      <input
                        type="checkbox"
                        checked={regra.roles.includes(role)}
                        onChange={() => toggleRole(regra.tipo, role)}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : "Salvar Regras"}
        </button>
      </div>
    </div>
  )
}
