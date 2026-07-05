"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { ArrowLeft, Save, Building2 } from "lucide-react"
import { toast } from "sonner"

type Representante = {
  id: number
  nome: string
  cnpj: string
  razaoSocial?: string | null
  email?: string | null
  telefone?: string | null
  contato?: string | null
  endereco?: string | null
  cidade?: string | null
  uf?: string | null
  gerenteId?: number | null
  idIntegracao?: string | null
}

export default function EditarRepresentantePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [representante, setRepresentante] = useState<Representante | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [id, setId] = useState<string>("")

  useEffect(() => {
    async function loadRepresentante() {
      const { id: repId } = await params
      setId(repId)
      try {
        const res = await fetch(`/api/representantes/${repId}`)
        if (res.ok) {
          const data = await res.json()
          setRepresentante(data)
        } else {
          toast.error("Representante não encontrado")
          router.push("/comercial/representantes")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadRepresentante()
  }, [params, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!representante) return

    setSaving(true)
    try {
      const res = await fetch(`/api/representantes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(representante),
      })

      if (res.ok) {
        toast.success("Representante atualizado com sucesso!")
        router.push("/comercial/representantes")
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao atualizar")
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar representante")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Representante, value: string) => {
    setRepresentante((prev) => prev ? { ...prev, [field]: value } : null)
  }

  const handleNumberChange = (field: keyof Representante, value: string) => {
    setRepresentante((prev) => prev ? { ...prev, [field]: value ? parseInt(value) : null } : null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!representante) return null

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/comercial/representantes"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Voltar para Representantes
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Editar Representante{info && <InfoButton content={info} />}</h1>
            <p className="text-sm text-slate-500">{representante.nome}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nome / Fantasia *
              </label>
              <input
                type="text"
                value={representante.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                CNPJ *
              </label>
              <input
                type="text"
                value={representante.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Razão Social
              </label>
              <input
                type="text"
                value={representante.razaoSocial || ""}
                onChange={(e) => handleChange("razaoSocial", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={representante.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Telefone
              </label>
              <input
                type="text"
                value={representante.telefone || ""}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Contato
              </label>
              <input
                type="text"
                value={representante.contato || ""}
                onChange={(e) => handleChange("contato", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cidade
              </label>
              <input
                type="text"
                value={representante.cidade || ""}
                onChange={(e) => handleChange("cidade", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                UF
              </label>
              <input
                type="text"
                value={representante.uf || ""}
                onChange={(e) => handleChange("uf", e.target.value)}
                maxLength={2}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm uppercase"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Endereço
              </label>
              <input
                type="text"
                value={representante.endereco || ""}
                onChange={(e) => handleChange("endereco", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Gerente Responsável (ID)
              </label>
              <input
                type="number"
                value={representante.gerenteId || ""}
                onChange={(e) => handleNumberChange("gerenteId", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                placeholder="ID do usuário gerente"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ID Integração (ERP/WMS/CRM/OUTROS)
              </label>
              <input
                type="text"
                value={representante.idIntegracao || ""}
                onChange={(e) => handleChange("idIntegracao", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                placeholder="Código do sistema externo"
              />
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <div />
            <div className="flex gap-2">
              <Link
                href="/comercial/representantes"
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
