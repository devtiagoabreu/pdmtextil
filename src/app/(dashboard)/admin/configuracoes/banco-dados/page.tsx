"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Loader2, Plus, Database, ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { BancoList } from "./components/banco-list"
import { NovaConexaoForm } from "./components/nova-conexao-form"
import { CriarDialog } from "./components/criar-dialog"
import { CloneDialog } from "./components/clone-dialog"
import { RedundDialog } from "./components/redund-dialog"
import { BackupCard } from "./components/backup-card"
import type { BancoDados } from "./components/types"

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
  const [baixandoBackup, setBaixandoBackup] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config/banco-dados")
      .then((res: any) => res.json())
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
      setLista(prev => prev.map((c: any) => ({ ...c, ativo: c.id === item.id })))
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
      setLista(prev => prev.filter((c: any) => c.id !== id))
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
    const destino = cloneDestinoId ? lista.find((c: any) => c.id === Number(cloneDestinoId)) : null
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

  async function handleBackup(connId?: number) {
    setBaixandoBackup(true)
    try {
      const params = connId ? `?conexao=${connId}` : ""
      const res = await fetch(`/api/admin/config/banco-dados/backup${params}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao gerar backup" }))
        throw new Error(err.error)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disposition = res.headers.get("Content-Disposition") || ""
      const match = disposition.match(/filename="?(.+?)"?$/)
      a.download = match?.[1] || `backup_pdm_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.sql`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Backup baixado com sucesso!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar backup")
    } finally {
      setBaixandoBackup(false)
    }
  }

  async function handleRedund() {
    if (!redundPrimario || !redundPrimaryDb || !redundStandbyDb) {
      toast.error("Preencha todos os campos")
      return
    }
    const standby = redundStandbyId ? lista.find((c: any) => c.id === Number(redundStandbyId)) : null
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

      <BancoList
        lista={lista}
        onCriar={setCriarModal}
        onClone={openClone}
        onRedund={openRedund}
        onAtivar={handleAtivar}
        onDelete={handleDelete}
      />

      {showForm ? (
        <NovaConexaoForm
          nome={nome}
          setNome={setNome}
          connectionString={connectionString}
          setConnectionString={setConnectionString}
          saving={saving}
          onAdd={handleAdd}
          onCancel={() => { setShowForm(false); setNome(""); setConnectionString("") }}
        />
      ) : (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} /> Nova Conexão
        </Button>
      )}

      <CriarDialog
        modal={criarModal}
        dbNome={criarDbNome}
        setDbNome={setCriarDbNome}
        loading={criarLoading}
        onConfirm={handleCriarBanco}
        onClose={() => { setCriarModal(null); setCriarDbNome("") }}
      />

      <CloneDialog
        open={cloneModal}
        origem={cloneOrigem}
        destinoId={cloneDestinoId}
        setDestinoId={setCloneDestinoId}
        sourceDb={cloneSourceDb}
        setSourceDb={setCloneSourceDb}
        targetDb={cloneTargetDb}
        setTargetDb={setCloneTargetDb}
        lista={lista}
        loading={cloneLoading}
        onConfirm={handleClone}
        onClose={() => setCloneModal(false)}
      />

      <RedundDialog
        open={redundModal}
        primario={redundPrimario}
        standbyId={redundStandbyId}
        setStandbyId={setRedundStandbyId}
        primaryDb={redundPrimaryDb}
        setPrimaryDb={setRedundPrimaryDb}
        standbyDb={redundStandbyDb}
        setStandbyDb={setRedundStandbyDb}
        lista={lista}
        loading={redundLoading}
        onConfirm={handleRedund}
        onClose={() => setRedundModal(false)}
      />

      <BackupCard
        baixando={baixandoBackup}
        temAtivo={lista.some((c: any) => c.ativo)}
        onBackup={() => handleBackup()}
      />

      <p className="text-xs text-slate-400">
        * A alteração do banco ativo requer reinicialização do servidor para aplicar.
      </p>
    </div>
  )
}
