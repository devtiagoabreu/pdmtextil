"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useStatuses } from "@/hooks/use-statuses"
import { normalizeVisitaFotos } from "@/lib/crm/visita-fotos"
import type { VisitaFoto } from "@/lib/crm/visita-fotos"
import VincularVisitaModal from "@/components/crm/vincular-visita-modal"
import { VisitaHeader } from "./components/visita-header"
import { EdicaoCard } from "./components/edicao-card"
import { VisualizacaoCard } from "./components/visualizacao-card"
import { CheckCard } from "./components/check-card"
import { RelatoFotos } from "./components/relato-fotos"

export default function DetalheVisitaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isGoogleUser = (session?.user as any)?.provider === "google"
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const { getLabel, getColor } = useStatuses("VISITA")
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [fotos, setFotos] = useState<VisitaFoto[]>([])
  const [conflictos, setConflictos] = useState<any[]>([])
  const conflictTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [empresaEndereco, setEmpresaEndereco] = useState<Record<string, string>>({})
  const [checkLoading, setCheckLoading] = useState<"in" | "out" | null>(null)
  const [showVincular, setShowVincular] = useState(false)

  const { data: estados = [] } = useQuery<{ id: number; uf: string }[]>({
    queryKey: ["crm-estados"],
    queryFn: () => fetch("/api/crm/estados").then((r: any) => r.json()),
  })

  const { data: oportunidades = [] } = useQuery<any[]>({
    queryKey: ["crm-oportunidades"],
    queryFn: () => fetch("/api/crm/oportunidades").then((r: any) => r.json()),
  })

  const visitaQuery = useQuery<any>({
    queryKey: ["visita", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/crm/visitas/${params.id}`)
      if (!res.ok) throw new Error("Erro ao carregar visita")
      return res.json()
    },
  })

  const visita = visitaQuery.data ?? null
  const loading = visitaQuery.isLoading && !visita

  useEffect(() => {
    if (visitaQuery.data) {
      setForm(visitaQuery.data)
      setFotos(normalizeVisitaFotos(visitaQuery.data.fotos))
    }
  }, [visitaQuery.data])

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
    if (!editing || !form.dataVisita || !form.hora) { setConflictos([]); return }
    conflictTimerRef.current = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ dataVisita: form.dataVisita, hora: form.hora, excludeId: String(params.id) })
        const res = await fetch(`/api/crm/visitas/conflictos?${sp}`)
        if (res.ok) {
          const data = await res.json()
          setConflictos(data.conflictos || [])
        }
      } catch {}
    }, 500)
  }, [form.dataVisita, form.hora, editing, params.id])

  async function loadVisita() {
    visitaQuery.refetch()
  }

  function setField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  function startEditing() {
    setForm({ ...visita })
    setFotos(normalizeVisitaFotos(visita.fotos))
    if (visita.empresaId) loadEmpresaEndereco(visita.empresaId)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setForm(visita)
    setFotos(normalizeVisitaFotos(visita.fotos))
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fotos: fotos,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao atualizar")
      }
      await loadVisita()
      setEditing(false)
      toast.success("Visita atualizada")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao excluir")
      }
      toast.success("Visita excluída")
      router.push("/comercial/crm/visitas")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }

  async function handleSyncGoogle() {
    try {
      const res = await fetch("/api/crm/visitas/sync-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitaId: visita.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao sincronizar")
      }
      await loadVisita()
      toast.success("Sincronizado com Google Calendar")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleUnsyncGoogle() {
    try {
      const res = await fetch(`/api/crm/visitas/sync-google?visitaId=${visita.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao dessincronizar")
      }
      await loadVisita()
      toast.success("Removido do Google Calendar")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function loadEmpresaEndereco(empresaId: number) {
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
    setForm((prev: any) => ({
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

  function handleCopiarEndereco() {
    if (!visita.empresaId) {
      toast.error("Visita sem pessoa vinculada")
      return
    }
    copiarEnderecoEmpresa()
  }

  async function handleCheck(tipo: "check_in" | "check_out") {
    setCheckLoading(tipo === "check_in" ? "in" : "out")
    try {
      let lat: number | null = null
      let lng: number | null = null

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
          })
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch {
          toast.warning("Sem acesso à localização. Check-in/out será registrado sem GPS.")
        }
      }

      const res = await fetch(`/api/crm/visitas/${params.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, latitude: lat, longitude: lng }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao registrar")
      }
      await loadVisita()
      toast.success(tipo === "check_in" ? "Check-in registrado!" : "Check-out registrado!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCheckLoading(null)
    }
  }

  async function handleUndo(tipo: "undo_check_in" | "undo_check_out") {
    const label = tipo === "undo_check_in" ? "check-in" : "check-out"
    setCheckLoading(tipo === "undo_check_in" ? "in" : "out")
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao desfazer")
      }
      await loadVisita()
      toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} desfeito!`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCheckLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!visita) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Visita não encontrada</p>
        <Link href="/comercial/crm/visitas" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  const userRole = (session?.user as any)?.role
  const userId = session?.user?.id ? parseInt(session.user.id) : null
  const isOwner = userId != null && visita?.criadoPor === userId
  const isAdmin = userRole === "ADMIN" || userRole === "SUDO"
  const canEdit = isAdmin || isOwner

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <VisitaHeader
        visita={visita}
        infoContent={info}
        statusLabel={getLabel(visita.status)}
        statusColor={getColor(visita.status)}
        onBack={() => router.back()}
        editing={editing}
        canEdit={canEdit}
        isGoogleUser={isGoogleUser}
        onSave={handleSave}
        onCancel={cancelEditing}
        onEdit={startEditing}
        onDelete={() => setShowDelete(true)}
        onSync={handleSyncGoogle}
        onUnsync={handleUnsyncGoogle}
        onVincular={() => setShowVincular(true)}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {editing ? (
          <EdicaoCard
            form={form}
            visita={visita}
            setField={setField}
            conflictos={conflictos}
            estadoId={estadoId}
            getStatusLabel={getLabel}
            onCopiarEndereco={handleCopiarEndereco}
            oportunidades={oportunidades}
          />
        ) : (
          <VisualizacaoCard
            visita={visita}
            statusLabel={getLabel(visita.status)}
            statusColor={getColor(visita.status)}
          />
        )}

        {!editing && canEdit && (
          <CheckCard
            visita={visita}
            checkLoading={checkLoading}
            onCheck={handleCheck}
            onUndo={handleUndo}
          />
        )}
      </div>

      <RelatoFotos
        editing={editing}
        visita={visita}
        form={form}
        setField={setField}
        fotos={fotos}
        onFotosChange={setFotos}
      />

      <VincularVisitaModal
        visitaId={visita.id}
        open={showVincular}
        onClose={() => setShowVincular(false)}
        onLinked={loadVisita}
      />

      <ConfirmModal
        open={showDelete}
        title="Excluir visita?"
        message="Tem certeza que deseja excluir esta visita?"
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
