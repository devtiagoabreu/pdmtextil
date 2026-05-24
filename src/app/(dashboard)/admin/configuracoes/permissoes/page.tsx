"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Save, Shield } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface PermissoesData {
  modulos: string[]
  permissoes: string[]
  roles: {
    id: number
    name: string
    label: string
    permissoes: Record<string, string[]>
  }[]
}

export default function PermissoesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [data, setData] = useState<PermissoesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [rolePerms, setRolePerms] = useState<Record<string, Record<string, string[]>>>({})

  useEffect(() => {
    fetch("/api/admin/permissoes")
      .then(res => res.json())
      .then((d: PermissoesData) => {
        setData(d)
        const map: Record<string, Record<string, string[]>> = {}
        for (const r of d.roles) {
          map[r.name] = r.permissoes
        }
        setRolePerms(map)
      })
      .catch(() => toast.error("Erro ao carregar permissões"))
      .finally(() => setLoading(false))
  }, [])

  const togglePerm = (roleName: string, modulo: string, permissao: string) => {
    setRolePerms(prev => {
      const next = { ...prev }
      const rolePerms = { ...(next[roleName] || {}) }
      const modPerms = [...(rolePerms[modulo] || [])]
      const idx = modPerms.indexOf(permissao)
      if (idx >= 0) modPerms.splice(idx, 1)
      else modPerms.push(permissao)
      rolePerms[modulo] = modPerms
      next[roleName] = rolePerms
      return next
    })
    setDirty(true)
  }

  const toggleModulo = (roleName: string, modulo: string, checked: boolean) => {
    setRolePerms(prev => {
      const next = { ...prev }
      const rolePerms = { ...(next[roleName] || {}) }
      rolePerms[modulo] = checked ? [...(data?.permissoes || [])] : []
      next[roleName] = rolePerms
      return next
    })
    setDirty(true)
  }

  const salvarTudo = async () => {
    setSaving(true)
    try {
      for (const roleName of Object.keys(rolePerms)) {
        const res = await fetch("/api/admin/permissoes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleName, permissoes: rolePerms[roleName] }),
        })
        if (!res.ok) throw new Error(`Erro ao salvar permissões de ${roleName}`)
      }
      toast.success("Permissões salvas!")
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

  if (!data) return <p className="p-6 text-red-500">Erro ao carregar dados</p>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Permissões por Perfil{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Gerencie o que cada perfil pode acessar no sistema</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <th className="p-3 text-left font-semibold text-slate-700 dark:text-slate-300 min-w-[140px]">Perfil</th>
              {data.modulos.map(mod => (
                <th key={mod} className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300 min-w-[140px]" colSpan={data.permissoes.length}>
                  {mod.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="p-2" />
              {data.modulos.map(mod => (
                data.permissoes.map(perm => (
                  <th key={`${mod}-${perm}`} className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 w-16">
                    {perm}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {data.roles.map(role => {
              const perms = rolePerms[role.name] || {}
              return (
                <tr key={role.name} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{role.label}</td>
                    {data.modulos.map(mod => {
                      const modPerms = Array.isArray(perms[mod]) ? perms[mod] : []
                      const allChecked = data.permissoes.every(p => modPerms.includes(p))
                    return (
                      <td key={mod} className="p-0" colSpan={data.permissoes.length}>
                        <div className="flex items-center justify-center gap-0">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={e => toggleModulo(role.name, mod, e.target.checked)}
                            title="Marcar/desmarcar todas"
                            className="mr-1 h-3.5 w-3.5 accent-blue-600"
                          />
                          {data.permissoes.map(perm => (
                            <label
                              key={perm}
                              className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={modPerms.includes(perm)}
                                onChange={() => togglePerm(role.name, mod, perm)}
                                className="h-4 w-4 accent-blue-600"
                              />
                            </label>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvarTudo}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : "Salvar Permissões"}
        </button>
      </div>
    </div>
  )
}
