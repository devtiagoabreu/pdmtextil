"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Calendar } from "lucide-react"
import { useSession } from "next-auth/react"
import PhotoUpload from "@/components/crm/photo-upload"
import { RelatoTemplateSelector } from "@/components/crm/relato-templates"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/crm/rich-text-editor"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { TipoEntidadeSelector } from "./components/tipo-entidade-selector"
import { FormFields } from "./components/form-fields"
import { EnderecoSection } from "./components/endereco-section"
import type { VisitaFoto } from "@/lib/crm/visita-fotos"

function NovaVisitaPageContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const isGoogleUser = (session?.user as any)?.provider === "google"
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const dataParam = searchParams.get("data")
  const [tipoEntidade, setTipoEntidade] = useState<"CLIENTE" | "PESSOA" | "AVULSA" | "">("")
  const [saving, setSaving] = useState(false)
  const [fotos, setFotos] = useState<VisitaFoto[]>([])
  const [conflictos, setConflictos] = useState<any[]>([])
  const [recorrencia, setRecorrencia] = useState<string>("nenhuma")
  const [recorrenciaFim, setRecorrenciaFim] = useState("")
  const [syncGoogle, setSyncGoogle] = useState(false)
  const conflictTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [form, setForm] = useState({
    empresaId: "",
    clienteId: "",
    nomeAvulso: "",
    oportunidadeId: "",
    contatoId: "",
    viagemId: "",
    dataVisita: dataParam || new Date().toISOString().split("T")[0],
    hora: "",
    tipo: "PRESENCIAL",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    relato: "",
    duracaoEstimada: "",
  })

  const { data: empresas = [] } = useQuery<any[]>({
    queryKey: ["crm-pessoas"],
    queryFn: () => fetch("/api/crm/pessoas").then((r: any) => r.json()),
  })

  const { data: oportunidades = [] } = useQuery<any[]>({
    queryKey: ["crm-oportunidades"],
    queryFn: () => fetch("/api/crm/oportunidades").then((r: any) => r.json()),
  })

  const { data: clientesList = [] } = useQuery<any[]>({
    queryKey: ["clientes"],
    queryFn: () => fetch("/api/clientes").then((r: any) => r.json()),
  })

  const { data: estados = [] } = useQuery<{ id: number; uf: string }[]>({
    queryKey: ["crm-estados"],
    queryFn: () => fetch("/api/crm/estados").then((r: any) => r.json()),
  })

  const contatosQuery = useQuery<any[]>({
    queryKey: ["visita-contatos", tipoEntidade, form.empresaId, form.clienteId],
    queryFn: async () => {
      if (tipoEntidade === "PESSOA" && form.empresaId) {
        const res = await fetch(`/api/crm/pessoas/${form.empresaId}`)
        const data = await res.json()
        return Array.isArray(data.contatos) ? data.contatos : []
      }
      if (tipoEntidade === "CLIENTE" && form.clienteId) {
        const res = await fetch(`/api/crm/contatos?clienteId=${form.clienteId}`)
        const data = await res.json()
        return Array.isArray(data) ? data : []
      }
      return []
    },
    enabled: (tipoEntidade === "PESSOA" && !!form.empresaId) || (tipoEntidade === "CLIENTE" && !!form.clienteId),
  })

  const enderecoQuery = useQuery<any>({
    queryKey: ["visita-endereco", tipoEntidade, form.empresaId, form.clienteId],
    queryFn: async () => {
      if (tipoEntidade === "PESSOA" && form.empresaId) {
        const res = await fetch(`/api/crm/pessoas/${form.empresaId}`)
        const data = await res.json()
        return {
          endereco: data.endereco || "",
          numero: data.numero || "",
          complemento: data.complemento || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          uf: data.uf || "",
          cep: data.cep || "",
        }
      }
      if (tipoEntidade === "CLIENTE" && form.clienteId) {
        const res = await fetch(`/api/clientes`)
        const data = await res.json()
        const cliente = Array.isArray(data) ? data.find((c: any) => String(c.id) === form.clienteId) : null
        if (cliente) {
          return {
            endereco: cliente.endereco || "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: cliente.cidade || "",
            uf: cliente.uf || "",
            cep: "",
          }
        }
        return {}
      }
      return {}
    },
    enabled: (tipoEntidade === "PESSOA" && !!form.empresaId) || (tipoEntidade === "CLIENTE" && !!form.clienteId),
  })

  const contatos = contatosQuery.data ?? []
  const empresaEndereco = enderecoQuery.data ?? {}

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (form.uf) {
      const found = estados.find((e: any) => e.uf === form.uf)
      setEstadoId(found ? found.id : null)
    } else {
      setEstadoId(null)
    }
  }, [form.uf, estados])

  useEffect(() => {
    if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current)
    if (!form.dataVisita || !form.hora) { setConflictos([]); return }
    conflictTimerRef.current = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ dataVisita: form.dataVisita, hora: form.hora })
        const res = await fetch(`/api/crm/visitas/conflictos?${sp}`)
        if (res.ok) {
          const data = await res.json()
          setConflictos(data.conflictos || [])
        }
      } catch {}
    }, 500)
  }, [form.dataVisita, form.hora])

  function loadEmpresas() {
    queryClient.invalidateQueries({ queryKey: ["crm-pessoas"] })
  }

  function loadClientes() {
    queryClient.invalidateQueries({ queryKey: ["clientes"] })
  }

  function loadOportunidades() {
    queryClient.invalidateQueries({ queryKey: ["crm-oportunidades"] })
  }

  function handleEmpresaCreated(id: number, razaoSocial: string) {
    loadEmpresas()
    setField("empresaId", String(id))
    setField("oportunidadeId", "")
    setField("contatoId", "")
  }

  function handleClienteCreated(id: number, nome: string) {
    loadClientes()
    setField("clienteId", String(id))
    setField("contatoId", "")
  }

  function handleContatoCreated(id: number) {
    queryClient.invalidateQueries({ queryKey: ["visita-contatos"] })
    setField("contatoId", String(id))
  }

  function handleOportunidadeCreated(id: number) {
    loadOportunidades()
    setField("oportunidadeId", String(id))
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

  function handleTrocar() {
    setTipoEntidade("")
    setField("empresaId", "")
    setField("clienteId", "")
    setField("oportunidadeId", "")
    setField("contatoId", "")
    setField("nomeAvulso", "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tipoEntidade === "PESSOA" && !form.empresaId) {
      toast.error("Pessoa é obrigatória")
      return
    }
    if (tipoEntidade === "CLIENTE" && !form.clienteId) {
      toast.error("Cliente é obrigatório")
      return
    }
    if (tipoEntidade === "AVULSA" && !form.nomeAvulso.trim()) {
      toast.error("Nome é obrigatório para visita avulsa")
      return
    }
    if (recorrencia !== "nenhuma" && !recorrenciaFim) {
      toast.error("Informe a data final da recorrência")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: tipoEntidade === "PESSOA" ? parseInt(form.empresaId) : null,
          clienteId: tipoEntidade === "CLIENTE" ? parseInt(form.clienteId) : null,
          nomeAvulso: tipoEntidade === "AVULSA" ? form.nomeAvulso.trim() : null,
          oportunidadeId: form.oportunidadeId ? parseInt(form.oportunidadeId) : null,
          contatoId: form.contatoId ? parseInt(form.contatoId) : null,
          viagemId: form.viagemId ? parseInt(form.viagemId) : null,
          dataVisita: form.dataVisita,
          hora: form.hora || null,
          tipo: form.tipo,
          endereco: form.endereco || null,
          numero: form.numero || null,
          complemento: form.complemento || null,
          bairro: form.bairro || null,
          cidade: form.cidade || null,
          uf: form.uf || null,
          cep: form.cep || null,
          relato: form.relato || null,
          duracaoEstimada: form.duracaoEstimada ? parseInt(form.duracaoEstimada) : null,
          fotos: fotos,
          recorrencia: recorrencia !== "nenhuma" ? recorrencia : undefined,
          recorrenciaFim: recorrencia !== "nenhuma" ? recorrenciaFim : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar visita")
      }
      const data = await res.json()
      if (syncGoogle && data.visita?.id) {
        try {
          await fetch("/api/crm/visitas/sync-google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitaId: data.visita.id }),
          })
        } catch {}
      }
      toast.success(data.total > 1 ? `${data.total} visitas criadas com sucesso` : "Visita criada com sucesso")
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
        <Link href="/comercial/crm/visitas" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nova Visita{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500">Agendar nova visita comercial</p>
        </div>
      </div>

      {!tipoEntidade && <TipoEntidadeSelector onSelect={setTipoEntidade} />}

      {tipoEntidade && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <FormFields
            form={form}
            setField={setField}
            conflictos={conflictos}
            tipoEntidade={tipoEntidade}
            empresas={empresas}
            clientesList={clientesList}
            oportunidades={oportunidades}
            contatos={contatos}
            recorrencia={recorrencia}
            setRecorrencia={setRecorrencia}
            recorrenciaFim={recorrenciaFim}
            setRecorrenciaFim={setRecorrenciaFim}
            onEmpresaCreated={handleEmpresaCreated}
            onClienteCreated={handleClienteCreated}
            onContatoCreated={handleContatoCreated}
            onOportunidadeCreated={handleOportunidadeCreated}
            onTrocar={handleTrocar}
          />

          <EnderecoSection
            form={form}
            setField={setField}
            estadoId={estadoId}
            tipoEntidade={tipoEntidade}
            onCopiarEndereco={copiarEnderecoEmpresa}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relato / Ata da Visita</label>
            <RelatoTemplateSelector onSelect={html => setField("relato", html)} />
            <RichTextEditor
              value={form.relato}
              onChange={v => setField("relato", v)}
              placeholder="Descreva o relato da visita..."
              minHeight="250px"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <PhotoUpload photos={fotos} onPhotosChange={setFotos} />
          </div>

          {isGoogleUser && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
              <Calendar size={18} className="text-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Sincronizar com Google Calendar</p>
                <p className="text-xs text-slate-500">Crie um evento no Google Calendar para esta visita</p>
              </div>
              <button
                type="button"
                onClick={() => setSyncGoogle(!syncGoogle)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${syncGoogle ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${syncGoogle ? "translate-x-5.5 ml-0.5" : "translate-x-0.5"}`} />
              </button>
            </div>
          )}

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
      )}
    </div>
  )
}

export default function NovaVisitaPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NovaVisitaPageContent />
    </Suspense>
  )
}
