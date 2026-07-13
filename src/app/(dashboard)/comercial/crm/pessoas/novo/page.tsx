"use client"

import { useState, useEffect, useCallback } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"

export default function NovaPessoaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PJ")
  const [form, setForm] = useState<any>({
    tipoPessoa: "PJ",
    nome: "",
    cpf: "",
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    segmento: "",
    porte: "",
    site: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    observacoes: "",
  })
  const [saving, setSaving] = useState(false)
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [estados, setEstados] = useState<{ id: number; uf: string }[]>([])

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/estados")
      if (res.ok) setEstados(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchEstados() }, [fetchEstados])

  useEffect(() => {
    if (form.uf) {
      const found = estados.find(e => e.uf === form.uf)
      setEstadoId(found ? found.id : null)
    } else {
      setEstadoId(null)
    }
  }, [form.uf, estados])

  function setField(field: string, value: string) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  function handleTipoChange(tipo: "PF" | "PJ") {
    setTipoPessoa(tipo)
    setForm((prev: any) => ({ ...prev, tipoPessoa: tipo }))
  }

  function getNomeObrigatorio() {
    return tipoPessoa === "PF" ? form.nome?.trim() : form.razaoSocial?.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!getNomeObrigatorio()) {
      toast.error(tipoPessoa === "PF" ? "Nome é obrigatório" : "Razão Social é obrigatória")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      const data = await res.json()
      toast.success("Pessoa cadastrada com sucesso")
      router.push(`/comercial/crm/pessoas/${data.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm/pessoas" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nova Pessoa (Negócio){info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500">Cadastrar um negócio (pessoa física ou jurídica) no CRM</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTipoChange("PF")}
              className={`px-4 py-2 text-sm rounded-lg font-medium border transition-colors ${
                tipoPessoa === "PF"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              Pessoa Física
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("PJ")}
              className={`px-4 py-2 text-sm rounded-lg font-medium border transition-colors ${
                tipoPessoa === "PJ"
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              Pessoa Jurídica
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {tipoPessoa === "PF" ? (
            <>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.nome || ""}
                  onChange={e => setField("nome", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
                <input
                  type="text"
                  value={form.cpf || ""}
                  onChange={e => setField("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razão Social *</label>
                <input
                  type="text"
                  value={form.razaoSocial}
                  onChange={e => setField("razaoSocial", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={form.nomeFantasia}
                  onChange={e => setField("nomeFantasia", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={e => setField("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Segmento</label>
            <input
              type="text"
              value={form.segmento}
              onChange={e => setField("segmento", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Porte</label>
            <select
              value={form.porte}
              onChange={e => setField("porte", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              <option value="MEI">MEI</option>
              <option value="ME">ME</option>
              <option value="EPP">EPP</option>
              <option value="MEDIO">Médio Porte</option>
              <option value="GRANDE">Grande Porte</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site</label>
            <input
              type="url"
              value={form.site}
              onChange={e => setField("site", e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Endereço</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logradouro</label>
            <input
              type="text"
              value={form.endereco}
              onChange={e => setField("endereco", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
            <input
              type="text"
              value={form.numero}
              onChange={e => setField("numero", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Complemento</label>
            <input
              type="text"
              value={form.complemento}
              onChange={e => setField("complemento", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
            <input
              type="text"
              value={form.bairro}
              onChange={e => setField("bairro", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
            <SelectUf value={form.uf} onChange={v => setField("uf", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
            <SelectCidade value={form.cidade} onChange={v => setField("cidade", v)} estadoId={estadoId} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
            <input
              type="text"
              value={form.cep}
              onChange={e => setField("cep", e.target.value)}
              placeholder="00.000-000"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={e => setField("observacoes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/comercial/crm/pessoas"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  )
}
