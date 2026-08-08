"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { htmlToModelo, modeloToHtml } from "@/lib/email-modelo"
import type { Modelo, Lista, Agendado, Disparo } from "./types"
import { DashboardRelatorio } from "./components/dashboard-relatorio"
import { EnviarTab } from "./components/enviar-tab"
import { ModelosTab } from "./components/modelos-tab"
import { ListasTab } from "./components/listas-tab"
import { HistoricoTab } from "./components/historico-tab"
import { AgendarTab } from "./components/agendar-tab"
import { ModeloDialogs } from "./components/modelo-dialogs"
import type { EditorEmailHandle } from "./components/editor-email"

export default function EmailMassaPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const editorRef = useRef<EditorEmailHandle>(null)

  const [assunto, setAssunto] = useState("")
  const [preheader, setPreheader] = useState("")
  const [para, setPara] = useState("todos")
  const [modoEnvio, setModoEnvio] = useState("bcc")
  const [selectedListaIds, setSelectedListaIds] = useState<number[]>([])
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState("enviar")
  const [disparoProgresso, setDisparoProgresso] = useState<Disparo | null>(null)
  const pollRef = useRef<number | null>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current)
    }
  }, [])

  const { data: modelos = [] } = useQuery<Modelo[]>({
    queryKey: ["email-massa-modelos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/modelos")
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: listas = [] } = useQuery<Lista[]>({
    queryKey: ["email-massa-listas"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/listas")
      if (!res.ok) return []
      return res.json()
    },
  })

  const queryClient = useQueryClient()

  const [modeloDialogOpen, setModeloDialogOpen] = useState(false)
  const [editModelo, setEditModelo] = useState<Modelo | null>(null)
  const [modeloForm, setModeloForm] = useState({ nome: "", assunto: "", html: "" })
  const [viewModelo, setViewModelo] = useState<Modelo | null>(null)

  const [remetente, setRemetente] = useState("sistema")
  const [userEmailConfig, setUserEmailConfig] = useState<{ email: string } | null>(null)

  const [agendadoForm, setAgendadoForm] = useState({ nome: "", agendadoPara: "" })
  const [editAgendado, setEditAgendado] = useState<Agendado | null>(null)

  const getContentHtml = () => editorRef.current?.getHtml() || ""

  const handleSend = async () => {
    const html = getContentHtml()
    if (!html || html === "<br>") {
      toast.error("Escreva o conteúdo do email")
      return
    }
    if (!assunto) {
      toast.error("Informe o assunto")
      return
    }
    if (para === "lista" && selectedListaIds.length === 0) {
      toast.error("Selecione pelo menos uma lista de destinatários")
      return
    }

    setSending(true)
    try {
      const body: any = {
        para, assunto, html, modo_envio: modoEnvio, remetente, preheader,
        nome: agendadoForm.nome || assunto,
      }
      if (para === "lista") body.listas = selectedListaIds

      const res = await fetch("/api/admin/email-massa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar disparo")
        setSending(false)
        return
      }
      toast.success(`Disparo criado: ${data.total} destinatário(s) na fila. Envio em andamento.`)
      setSending(false)
      setDisparoProgresso({ ...data, enviados: 0, falhas: 0, pendentes: data.total } as Disparo)
      pollDisparo(data.disparoId)
      if (!processingRef.current) {
        processingRef.current = true
        fetch("/api/admin/email-massa/processar", { method: "POST" })
          .catch(() => {})
          .finally(() => { processingRef.current = false })
      }
      queryClient.invalidateQueries({ queryKey: ["email-massa-disparos"] })
    } catch {
      setSending(false)
      toast.error("Erro ao criar disparo")
    }
  }

  const pollDisparo = (disparoId: number) => {
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/email-massa/disparos/${disparoId}`)
        if (!res.ok) return
        const d = await res.json()
        setDisparoProgresso(d)
        if (d.status === "concluido") {
          if (pollRef.current) window.clearInterval(pollRef.current)
          pollRef.current = null
          setDisparoProgresso(null)
          toast.success(`Envio concluído: ${d.enviados} enviado(s), ${d.falhas} falha(s)`)
          queryClient.invalidateQueries({ queryKey: ["email-massa-disparos"] })
          queryClient.invalidateQueries({ queryKey: ["email-massa-historico"] })
          queryClient.invalidateQueries({ queryKey: ["email-massa-relatorio"] })
        } else if (d.status === "erro") {
          if (pollRef.current) window.clearInterval(pollRef.current)
          pollRef.current = null
          setDisparoProgresso(null)
          toast.error(d.erro || "Erro no envio do disparo")
          queryClient.invalidateQueries({ queryKey: ["email-massa-disparos"] })
        } else if (d.status === "fila" || d.status === "enviando" || d.status === "pausado") {
          if (!processingRef.current) {
            processingRef.current = true
            fetch("/api/admin/email-massa/processar", { method: "POST" })
              .catch(() => {})
              .finally(() => { processingRef.current = false })
          }
        }
      } catch {
        // mantém o polling
      }
    }, 3000)
  }

  const salvarAgendado = async (status: "rascunho" | "agendado") => {
    const html = getContentHtml()
    if (!html || html === "<br>") { toast.error("Escreva o conteúdo do email"); return }
    if (!assunto) { toast.error("Informe o assunto"); return }
    if (status === "agendado" && !agendadoForm.agendadoPara) { toast.error("Informe a data e hora do envio"); return }
    if (para === "lista" && selectedListaIds.length === 0) { toast.error("Selecione pelo menos uma lista"); return }

    try {
      const body: any = {
        nome: agendadoForm.nome || assunto,
        para, assunto, preheader, html, listas: para === "lista" ? selectedListaIds : null,
        modoEnvio, remetente, agendadoPara: agendadoForm.agendadoPara || null, status,
      }
      const url = editAgendado ? `/api/admin/email-massa/agendados/${editAgendado.id}` : "/api/admin/email-massa/agendados"
      const res = await fetch(url, { method: editAgendado ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(status === "agendado" ? "Disparo agendado!" : "Rascunho salvo!")
        setEditAgendado(null)
        setAgendadoForm({ nome: "", agendadoPara: "" })
        queryClient.invalidateQueries({ queryKey: ["email-massa-agendados"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Erro ao salvar")
      }
    } catch { toast.error("Erro ao salvar agendamento") }
  }

  const enviarAgendado = async (a: Agendado) => {
    try {
      const res = await fetch(`/api/admin/email-massa/agendados/${a.id}/enviar`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar agendamento")
        return
      }
      setDisparoProgresso({ ...data, enviados: 0, falhas: 0, pendentes: data.total } as Disparo)
      pollDisparo(data.disparoId)
      if (!processingRef.current) {
        processingRef.current = true
        fetch("/api/admin/email-massa/processar", { method: "POST" })
          .catch(() => {})
          .finally(() => { processingRef.current = false })
      }
      queryClient.invalidateQueries({ queryKey: ["email-massa-agendados"] })
      queryClient.invalidateQueries({ queryKey: ["email-massa-historico"] })
      toast.success(`Envio iniciado: ${data.total} destinatário(s)`)
    } catch {
      toast.error("Erro ao iniciar envio")
    }
  }

  const carregarAgendado = (a: Agendado) => {
    setEditAgendado(a)
    setAssunto(a.assunto)
    setPreheader(a.preheader || "")
    setPara(a.para)
    setModoEnvio(a.modoEnvio || "bcc")
    setRemetente(a.remetente || "sistema")
    setSelectedListaIds(a.listas || [])
    setAgendadoForm({ nome: a.nome, agendadoPara: a.agendadoPara ? new Date(a.agendadoPara).toISOString().slice(0, 16) : "" })
    setActiveTab("enviar")
    setTimeout(() => editorRef.current?.setHtml(a.html), 100)
    toast.success(`Disparo "${a.nome}" carregado no editor`)
  }

  const usarModelo = (m: Modelo) => {
    setAssunto(m.assunto)
    setPreheader("")
    setActiveTab("enviar")
    setTimeout(() => {
      editorRef.current?.setHtml(modeloToHtml(m.html))
    }, 100)
    toast.success(`Modelo "${m.nome}" carregado`)
  }

  const salvarModelo = async () => {
    if (!modeloForm.nome) { toast.error("Informe o nome do modelo"); return }
    try {
      const url = editModelo
        ? `/api/admin/email-massa/modelos/${editModelo.id}`
        : "/api/admin/email-massa/modelos"
      const method = editModelo ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(modeloForm) })
      if (res.ok) {
        toast.success(editModelo ? "Modelo atualizado" : "Modelo criado")
        setModeloDialogOpen(false)
        setEditModelo(null)
        setModeloForm({ nome: "", assunto: "", html: "" })
        queryClient.invalidateQueries({ queryKey: ["email-massa-modelos"] })
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao salvar")
      }
    } catch {
      toast.error("Erro ao salvar modelo")
    }
  }

  const deletarModelo = async (id: number) => {
    if (!confirm("Deletar este modelo?")) return
    try {
      const res = await fetch(`/api/admin/email-massa/modelos/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Modelo deletado")
        queryClient.invalidateQueries({ queryKey: ["email-massa-modelos"] })
      }
    } catch {
      toast.error("Erro ao deletar")
    }
  }

  const abrirEditarModelo = (m: Modelo) => {
    setEditModelo(m)
    setModeloForm({ nome: m.nome, assunto: m.assunto, html: m.html })
    setModeloDialogOpen(true)
  }

  const abrirNovoModelo = () => {
    setEditModelo(null)
    setModeloForm({ nome: "", assunto: "", html: htmlToModelo(getContentHtml()) })
    setModeloDialogOpen(true)
  }

  return (
    <div className="w-full flex flex-col space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Email em Massa{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Envie emails, gerencie modelos e listas, acompanhe o histórico</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col space-y-6">
        <TabsList className="w-full flex justify-start border-b rounded-none bg-transparent h-auto p-0 space-x-6">
          <TabsTrigger value="enviar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Enviar Email</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Modelos</TabsTrigger>
          <TabsTrigger value="listas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Listas</TabsTrigger>
          <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Histórico</TabsTrigger>
          <TabsTrigger value="agendar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Programar Disparo</TabsTrigger>
          <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Dashboard</TabsTrigger>
        </TabsList>

        {/* ────────── TAB ENVIAR ────────── */}
        <TabsContent value="enviar" className="w-full m-0 border-0 p-0 shadow-none">
          <EnviarTab
            editorRef={editorRef}
            assunto={assunto}
            setAssunto={setAssunto}
            preheader={preheader}
            setPreheader={setPreheader}
            para={para}
            setPara={setPara}
            modoEnvio={modoEnvio}
            setModoEnvio={setModoEnvio}
            remetente={remetente}
            setRemetente={setRemetente}
            userEmailConfig={userEmailConfig}
            listas={listas}
            selectedListaIds={selectedListaIds}
            toggleListaSelecionada={(id) => setSelectedListaIds(prev =>
              prev.includes(id) ? prev.filter((lid: number) => lid !== id) : [...prev, id]
            )}
            agendadoForm={agendadoForm}
            setAgendadoForm={setAgendadoForm}
            editAgendado={editAgendado}
            onLimparEdicao={() => { setEditAgendado(null); setAgendadoForm({ nome: "", agendadoPara: "" }) }}
            modelos={modelos}
            onUsarModelo={usarModelo}
            onSalvarComoModelo={abrirNovoModelo}
            onSalvarAgendado={salvarAgendado}
            sending={sending}
            onEnviar={handleSend}
            disparoProgresso={disparoProgresso}
          />
        </TabsContent>

        {/* ────────── TAB MODELOS ────────── */}
        <TabsContent value="modelos" className="w-full m-0 border-0 p-0 shadow-none">
          <ModelosTab
            modelos={modelos}
            onNovo={abrirNovoModelo}
            onUsar={usarModelo}
            onEditar={abrirEditarModelo}
            onVer={setViewModelo}
            onDeletar={deletarModelo}
          />
        </TabsContent>

        {/* ────────── TAB LISTAS ────────── */}
        <TabsContent value="listas" className="w-full m-0 border-0 p-0 shadow-none">
          <ListasTab onListaDeletada={(id) =>
            setSelectedListaIds(prev => prev.filter((lid: number) => lid !== id))
          } />
        </TabsContent>

        {/* ────────── TAB HISTÓRICO ────────── */}
        <TabsContent value="historico" className="w-full m-0 border-0 p-0 shadow-none">
          <HistoricoTab />
        </TabsContent>

        {/* ────────── TAB AGENDAR ────────── */}
        <TabsContent value="agendar" className="w-full m-0 border-0 p-0 shadow-none">
          <AgendarTab
            onCarregarNoEditor={carregarAgendado}
            onNovoDisparo={() => { setEditAgendado(null); setAgendadoForm({ nome: "", agendadoPara: "" }); setActiveTab("enviar") }}
            onEnviarAgendado={enviarAgendado}
            disparoProgresso={disparoProgresso}
          />
        </TabsContent>

        {/* ────────── TAB DASHBOARD ────────── */}
        <TabsContent value="dashboard" className="w-full m-0 border-0 p-0 shadow-none">
          <div className="w-full rounded-xl border bg-card text-card-foreground shadow p-6">
            <DashboardRelatorio />
          </div>
        </TabsContent>
      </Tabs>

      <ModeloDialogs
        open={modeloDialogOpen}
        onOpenChange={setModeloDialogOpen}
        editModelo={editModelo}
        form={modeloForm}
        setForm={setModeloForm}
        onSalvar={salvarModelo}
        viewModelo={viewModelo}
        onFecharVer={() => setViewModelo(null)}
        onUsarModelo={usarModelo}
      />
    </div>
  )
}
