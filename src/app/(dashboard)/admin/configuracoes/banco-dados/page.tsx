"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Loader2, Plus, Trash2, Database, Check, ArrowLeft,
  Circle, Copy, GitBranch,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

interface BancoDados {
  id: number
  nome: string
  connectionString: string
  ativo: boolean
}

export default function BancoDadosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [lista, setLista] = useState<BancoDados[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState("")
  const [connectionString, setConnectionString] = useState("")
  const [saving, setSaving] = useState(false)

  const [criarModal, setCriarModal] = useState<BancoDados | null>(null)
  const [criarDbNome, setCriarDbNome] = useState("")
  const [criarLoading, setCriarLoading] = useState(false)

  const [cloneModal, setCloneModal] = useState(false)
  const [cloneOrigem, setCloneOrigem] = useState<BancoDados | null>(null)
  const [cloneDestinoId, setCloneDestinoId] = useState("")
  const [cloneSourceDb, setCloneSourceDb] = useState("")
  const [cloneTargetDb, setCloneTargetDb] = useState("")
  const [cloneLoading, setCloneLoading] = useState(false)

  const [redundModal, setRedundModal] = useState(false)
  const [redundPrimario, setRedundPrimario] = useState<BancoDados | null>(null)
  const [redundStandbyId, setRedundStandbyId] = useState("")
  const [redundPrimaryDb, setRedundPrimaryDb] = useState("")
  const [redundStandbyDb, setRedundStandbyDb] = useState("")
  const [redundLoading, setRedundLoading] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config/banco-dados")
      .then(res => res.json())
      .then(setLista)
      .catch(() => toast.error("Erro ao carregar conexões"))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    if (!nome || !connectionString) {
      toast.error("Nome e string de conexão são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config/banco-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, connectionString }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setLista(prev => [...prev, item])
      setNome("")
      setConnectionString("")
      setShowForm(false)
      toast.success("Conexão adicionada!")
    } catch {
      toast.error("Erro ao adicionar conexão")
    } finally {
      setSaving(false)
    }
  }

  async function handleAtivar(item: BancoDados) {
    try {
      const res = await fetch("/api/admin/config/banco-dados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ativo: true }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.map(c => ({ ...c, ativo: c.id === item.id })))
      toast.success(`"${item.nome}" definido como ativo`)
    } catch {
      toast.error("Erro ao ativar conexão")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover esta conexão?")) return
    try {
      const res = await fetch("/api/admin/config/banco-dados", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.filter(c => c.id !== id))
      toast.success("Conexão removida")
    } catch {
      toast.error("Erro ao remover conexão")
    }
  }

  async function handleCriarBanco() {
    if (!criarModal || !criarDbNome) {
      toast.error("Informe o nome do banco")
      return
    }
    setCriarLoading(true)
    try {
      const res = await fetch("/api/admin/config/banco-dados/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString: criarModal.connectionString, dbName: criarDbNome }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setCriarModal(null)
      setCriarDbNome("")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar banco")
    } finally {
      setCriarLoading(false)
    }
  }

  function openClone(origem: BancoDados) {
    setCloneOrigem(origem)
    setCloneSourceDb("")
    setCloneTargetDb("")
    setCloneDestinoId("")
    setCloneModal(true)
  }

  async function handleClone() {
    if (!cloneOrigem || !cloneSourceDb || !cloneTargetDb) {
      toast.error("Preencha todos os campos")
      return
    }
    const destino = cloneDestinoId ? lista.find(c => c.id === Number(cloneDestinoId)) : null
    if (!destino) {
      toast.error("Selecione a conexão de destino")
      return
    }
    setCloneLoading(true)
    try {
      const res = await fetch("/api/admin/config/banco-dados/clonar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceConnString: cloneOrigem.connectionString,
          targetConnString: destino.connectionString,
          sourceDb: cloneSourceDb,
          targetDb: cloneTargetDb,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setCloneModal(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao clonar banco")
    } finally {
      setCloneLoading(false)
    }
  }

  function openRedund(primario: BancoDados) {
    setRedundPrimario(primario)
    setRedundPrimaryDb("")
    setRedundStandbyDb("")
    setRedundStandbyId("")
    setRedundModal(true)
  }

  async function handleRedund() {
    if (!redundPrimario || !redundPrimaryDb || !redundStandbyDb) {
      toast.error("Preencha todos os campos")
      return
    }
    const standby = redundStandbyId ? lista.find(c => c.id === Number(redundStandbyId)) : null
    if (!standby) {
      toast.error("Selecione a conexão standby")
      return
    }
    setRedundLoading(true)
    try {
      const res = await fetch("/api/admin/config/banco-dados/redundancia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryConnString: redundPrimario.connectionString,
          standbyConnString: standby.connectionString,
          primaryDb: redundPrimaryDb,
          standbyDb: redundStandbyDb,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setRedundModal(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao configurar redundância")
    } finally {
      setRedundLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Banco de Dados{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Gerencie as conexões com banco de dados</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {lista.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">Nenhuma conexão cadastrada</p>
          ) : (
            lista.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  {item.ativo ? (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 flex-shrink-0">
                      <Check size={16} />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex-shrink-0">
                      <Database size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.nome}</p>
                    <p className="text-xs text-slate-500 font-mono truncate max-w-md">{item.connectionString}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.ativo && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setCriarModal(item)} className="gap-1" aria-label="Criar banco de dados">
                        <Circle size={14} /> Criar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openClone(item)} className="gap-1" aria-label="Clonar banco de dados">
                        <Copy size={14} /> Clonar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openRedund(item)} className="gap-1" aria-label="Configurar redundância">
                        <GitBranch size={14} /> Redund.
                      </Button>
                    </>
                  )}
                  {!item.ativo && (
                    <Button size="sm" variant="outline" onClick={() => handleAtivar(item)} className="gap-1">
                      <Check size={14} /> Ativar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} className="gap-1 text-red-600" aria-label="Remover conexão">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Nova Conexão</h2>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Produção Neon" />
          </div>
          <div className="space-y-2">
            <Label>String de Conexão</Label>
            <Input value={connectionString} onChange={e => setConnectionString(e.target.value)} placeholder="postgresql://user:pass@host:5432/postgres" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={saving} className="gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Adicionar
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setNome(""); setConnectionString("") }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} /> Nova Conexão
        </Button>
      )}

      {/* Modal: Criar Banco */}
      <Dialog open={!!criarModal} onOpenChange={(v: boolean) => { if (!v) { setCriarModal(null); setCriarDbNome("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Banco de Dados</DialogTitle>
            <DialogDescription>
              Cria um novo banco vazio na conexão <strong>{criarModal?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome do banco</Label>
            <Input value={criarDbNome} onChange={e => setCriarDbNome(e.target.value)} placeholder="Ex: novo_banco" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCriarModal(null); setCriarDbNome("") }}>Cancelar</Button>
            <Button onClick={handleCriarBanco} disabled={criarLoading || !criarDbNome} className="gap-2">
              {criarLoading && <Loader2 size={16} className="animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Clonar Banco */}
      <Dialog open={cloneModal} onOpenChange={(v: boolean) => { if (!v) setCloneModal(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar Banco de Dados</DialogTitle>
            <DialogDescription>
              Clona um banco de dados existente para outro banco.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conexão de origem</Label>
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{cloneOrigem?.nome}</p>
            </div>
            <div className="space-y-2">
              <Label>Banco de origem</Label>
              <Input value={cloneSourceDb} onChange={e => setCloneSourceDb(e.target.value)} placeholder="Ex: producao_principal" />
            </div>
            <div className="space-y-2">
              <Label>Conexão de destino</Label>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={cloneDestinoId}
                onChange={e => setCloneDestinoId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {lista.filter(c => c.id !== cloneOrigem?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Novo banco (destino)</Label>
              <Input value={cloneTargetDb} onChange={e => setCloneTargetDb(e.target.value)} placeholder="Ex: producao_backup" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneModal(false)}>Cancelar</Button>
            <Button onClick={handleClone} disabled={cloneLoading || !cloneSourceDb || !cloneTargetDb || !cloneDestinoId} className="gap-2">
              {cloneLoading && <Loader2 size={16} className="animate-spin" />}
              Clonar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Redundância */}
      <Dialog open={redundModal} onOpenChange={(v: boolean) => { if (!v) setRedundModal(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redundância de Dados</DialogTitle>
            <DialogDescription>
              Configura replicação lógica entre dois bancos (publicação + inscrição).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Servidor primário</Label>
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{redundPrimario?.nome}</p>
            </div>
            <div className="space-y-2">
              <Label>Banco primário</Label>
              <Input value={redundPrimaryDb} onChange={e => setRedundPrimaryDb(e.target.value)} placeholder="Ex: producao" />
            </div>
            <div className="space-y-2">
              <Label>Servidor standby</Label>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={redundStandbyId}
                onChange={e => setRedundStandbyId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {lista.filter(c => c.id !== redundPrimario?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Banco standby</Label>
              <Input value={redundStandbyDb} onChange={e => setRedundStandbyDb(e.target.value)} placeholder="Ex: producao_standby" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedundModal(false)}>Cancelar</Button>
            <Button onClick={handleRedund} disabled={redundLoading || !redundPrimaryDb || !redundStandbyDb || !redundStandbyId} className="gap-2">
              {redundLoading && <Loader2 size={16} className="animate-spin" />}
              Configurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-slate-400">
        * A alteração do banco ativo requer reinicialização do servidor para aplicar.
      </p>
    </div>
  )
}
