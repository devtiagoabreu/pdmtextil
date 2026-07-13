"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { QuickCreatePessoa } from "@/components/crm/quick-create-pessoa"
import { QuickCreateContato } from "@/components/crm/quick-create-contato"
import { QuickCreateOportunidade } from "@/components/crm/quick-create-oportunidade"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"

const TIPO_OPTIONS = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIDEO", label: "Vídeo" },
  { value: "TELEFONE", label: "Telefone" },
]

export default function NovaVisitaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [oportunidades, setOportunidades] = useState<any[]>([])
  const [contatos, setContatos] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [fotoInputs, setFotoInputs] = useState<string[]>([""])
  const [empresaEndereco, setEmpresaEndereco] = useState<any>({})
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [estados, setEstados] = useState<{ id: number; uf: string }[]>([])
  const [form, setForm] = useState({
    empresaId: "",
    oportunidadeId: "",
    contatoId: "",
    dataVisita: new Date().toISOString().split("T")[0],
    tipo: "PRESENCIAL",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    relato: "",
  })

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function load() {
      try {
        const [empresasRes, oportunidadesRes] = await Promise.allSettled([
          fetch("/api/crm/pessoas").then(r => r.json()),
          fetch("/api/crm/oportunidades").then(r => r.json()),
        ])
        if (empresasRes.status === "fulfilled" && Array.isArray(empresasRes.value)) setEmpresas(empresasRes.value)
        if (oportunidadesRes.status === "fulfilled" && Array.isArray(oportunidadesRes.value)) setOportunidades(oportunidadesRes.value)
      } catch {
        toast.error("Erro ao carregar dados")
      }
    }
    load()
  }, [])

  useEffect(() => {
    loadContatos(form.empresaId)
    loadEmpresaEndereco(form.empresaId)
  }, [form.empresaId])

  useEffect(() => {
    fetch("/api/crm/estados").then(r => r.json()).then(setEstados).catch(() => {})
  }, [])

  useEffect(() => {
    if (form.uf) {
      const found = estados.find(e => e.uf === form.uf)
      setEstadoId(found ? found.id : null)
    } else {
      setEstadoId(null)
    }
  }, [form.uf, estados])

  async function loadEmpresas() {
    try {
      const res = await fetch("/api/crm/pessoas")
      const data = await res.json()
      if (Array.isArray(data)) setEmpresas(data)
    } catch {}
  }

  async function loadOportunidades() {
    try {
      const res = await fetch("/api/crm/oportunidades")
      const data = await res.json()
      if (Array.isArray(data)) setOportunidades(data)
    } catch {}
  }

  function handleEmpresaCreated(id: number, razaoSocial: string) {
    loadEmpresas()
    setField("empresaId", String(id))
    setField("oportunidadeId", "")
    setField("contatoId", "")
  }

  function handleContatoCreated(id: number) {
    loadContatos(form.empresaId)
    setField("contatoId", String(id))
  }

  function handleOportunidadeCreated(id: number) {
    loadOportunidades()
    setField("oportunidadeId", String(id))
  }

  async function loadContatos(empresaId: string) {
    if (!empresaId) { setContatos([]); return }
    try {
      const res = await fetch(`/api/crm/pessoas/${empresaId}`)
      const data = await res.json()
      if (Array.isArray(data.contatos)) setContatos(data.contatos)
      else setContatos([])
    } catch { setContatos([]) }
  }

  async function loadEmpresaEndereco(empresaId: string) {
    if (!empresaId) { setEmpresaEndereco({}); return }
    try {
      const res = await fetch(`/api/crm/pessoas/${empresaId}`)
      const data = await res.json()
      setEmpresaEndereco({
        endereco: data.endereco || "",
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        uf: data.uf || "",
        cep: data.cep || "",
      })
    } catch { setEmpresaEndereco({}) }
  }

  function copiarEnderecoEmpresa() {
    setForm(prev => ({
      ...prev,
      endereco: empresaEndereco.endereco || "",
      numero: empresaEndereco.numero || "",
      complemento: empresaEndereco.complemento || "",
      bairro: empresaEndereco.bairro || "",
      cidade: empresaEndereco.cidade || "",
      uf: empresaEndereco.uf || "",
      cep: empresaEndereco.cep || "",
    }))
  }

  function addFotoInput() {
    setFotoInputs(prev => [...prev, ""])
  }

  function updateFotoInput(index: number, value: string) {
    setFotoInputs(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function removeFotoInput(index: number) {
    setFotoInputs(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.empresaId) {
      toast.error("Pessoa é obrigatória")
      return
    }
    setSaving(true)
    try {
      const fotos = fotoInputs.filter(f => f.trim())
      const res = await fetch("/api/crm/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: parseInt(form.empresaId),
          oportunidadeId: form.oportunidadeId ? parseInt(form.oportunidadeId) : null,
          contatoId: form.contatoId ? parseInt(form.contatoId) : null,
          dataVisita: form.dataVisita,
          tipo: form.tipo,
          endereco: form.endereco || null,
          numero: form.numero || null,
          complemento: form.complemento || null,
          bairro: form.bairro || null,
          cidade: form.cidade || null,
          uf: form.uf || null,
          cep: form.cep || null,
          relato: form.relato || null,
          fotos: fotos.length > 0 ? fotos : [],
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar visita")
      }
      toast.success("Visita criada com sucesso")
      router.push("/comercial/crm/visitas")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm/visitas" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nova Visita{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500">Agendar nova visita comercial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pessoa *
              <QuickCreatePessoa onCreated={handleEmpresaCreated} />
            </label>
            <select
              value={form.empresaId}
              onChange={e => {
                setField("empresaId", e.target.value)
                setField("oportunidadeId", "")
                setField("contatoId", "")
              }}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione...</option>
              {empresas.map(e => (
                <option key={e.id} value={String(e.id)}>{e.razaoSocial || e.nomeFantasia}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Visita</label>
            <input
              type="date"
              value={form.dataVisita}
              onChange={e => setField("dataVisita", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={e => setField("tipo", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIPO_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Oportunidade
              <QuickCreateOportunidade empresaId={form.empresaId} onCreated={handleOportunidadeCreated} />
            </label>
            <select
              value={form.oportunidadeId}
              onChange={e => setField("oportunidadeId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {oportunidades
                .filter((o: any) => !form.empresaId || String(o.empresaId) === form.empresaId)
                .map((o: any) => (
                  <option key={o.id} value={String(o.id)}>{o.titulo}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contato
              <QuickCreateContato empresaId={form.empresaId} onCreated={handleContatoCreated} />
            </label>
            <select
              value={form.contatoId}
              onChange={e => setField("contatoId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {contatos.map((c: any) => (
                <option key={c.id} value={String(c.id)}>{c.nome}{c.cargo ? ` (${c.cargo})` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Endereço da Visita</h3>
            {form.empresaId && (
              <button
                type="button"
                onClick={copiarEnderecoEmpresa}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Copiar endereço da pessoa
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relato / Ata da Visita</label>
          <textarea
            value={form.relato}
            onChange={e => setField("relato", e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descreva o relato da visita..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fotos (URLs)</label>
            <button type="button" onClick={addFotoInput} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus size={12} /> Adicionar foto
            </button>
          </div>
          <div className="space-y-2">
            {fotoInputs.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={e => updateFotoInput(i, e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fotoInputs.length > 1 && (
                  <button type="button" onClick={() => removeFotoInput(i)} className="p-1 text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/comercial/crm/visitas"
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
