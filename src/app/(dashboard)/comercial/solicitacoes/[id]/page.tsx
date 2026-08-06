"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { getInfoContent } from "@/lib/info-content"
import Link from "next/link"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useStatuses, hexToRgba } from "@/hooks/use-statuses"
import { fetchSolicitacao } from "./components/api"
import { Header } from "./components/header"
import { DadosComerciais } from "./components/dados-comerciais"
import { BriefingTecnico } from "./components/briefing"
import { Anexos } from "./components/anexos"
import { Produtos } from "./components/produtos"
import { Historico } from "./components/historico"

export default function DetalheSolicitacaoPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const id = params.id as string
  const [mounted, setMounted] = useState(false)
  const [produtos, setProdutos] = useState<any[]>([])
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlocked, setDeleteBlocked] = useState(false)
  const [novoStatus, setNovoStatus] = useState("")
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([])
  const { getLabel: getStatusLabel, getColor: getStatusColor } = useStatuses("SOLICITACAO_DESENVOLVIMENTO")

  useEffect(() => {
    fetch("/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO")
      .then((r: any) => r.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setStatusOptions(data.map((s: any) => ({ value: s.nome, label: s.rotulo || s.nome })))
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (id) {
      fetch(`/api/solicitacoes/${id}/produtos-cru`)
        .then((r: any) => r.json())
        .then((data: any) => setProdutos(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [id])

  const { data: sol, isLoading, error, refetch } = useQuery({
    queryKey: ["solicitacao", id],
    queryFn: () => fetchSolicitacao(id),
    enabled: mounted && !!id,
    staleTime: 0,
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteBlocked(false)
    try {
      const res = await fetch(`/api/solicitacoes/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.fkError) {
          setDeleteBlocked(true)
          return
        }
        throw new Error(data.error || "Erro ao excluir")
      }
      toast.success("Solicitação excluída com sucesso")
      setDeleteTarget(null)
      router.push("/comercial/solicitacoes")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!novoStatus) return
    setStatusLoading(true)
    try {
      const res = await fetch(`/api/solicitacoes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao alterar status")
      }
      toast.success("Status alterado com sucesso!")
      refetch()
      setNovoStatus("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar status")
    } finally {
      setStatusLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !sol) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Erro ao carregar solicitação</p>
        <Link href="/comercial/solicitacoes" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar à lista
        </Link>
      </div>
    )
  }

  const handleExportPdf = () => {
    const filename = `${sol.id}-${(sol.projeto || "sem-projeto").replace(/[^a-zA-Z0-9]/g, "-")}-${new Date(sol.createdAt).toISOString().split("T")[0]}.pdf`
    const printContent = document.getElementById("ficha-impressao")
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            h2 { font-size: 18px; margin: 20px 0 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            h3 { font-size: 14px; margin: 15px 0 8px; color: #555; }
            .header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .field { margin-bottom: 8px; }
            .label { font-weight: bold; color: #555; font-size: 12px; }
            .value { font-size: 13px; }
            .section { margin: 20px 0; }
            .links { list-style: none; }
            .links li { margin: 5px 0; }
            .links a { color: #0066cc; text-decoration: none; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const statusColor = getStatusColor(sol.status)
  const statusRgba = hexToRgba(statusColor, 0.15)
  const statusLabel = getStatusLabel(sol.status)

  return (
    <div className="space-y-6 animate-fade-in">
      <Header
        id={id}
        sol={sol}
        info={info}
        statusLabel={statusLabel}
        statusRgba={statusRgba}
        statusColor={statusColor}
        statusOptions={statusOptions}
        novoStatus={novoStatus}
        setNovoStatus={setNovoStatus}
        statusLoading={statusLoading}
        onStatusChange={handleStatusChange}
        onRefetch={() => refetch()}
        onExportPdf={handleExportPdf}
        onDelete={() => {
          setDeleteTarget({ id: sol.id, anexos: sol.anexos })
          setDeleteBlocked(false)
        }}
      />

      <div className="print:block" id="ficha-impressao">
        <div className="space-y-6">
          <DadosComerciais sol={sol} />
          <BriefingTecnico briefing={sol.briefing || {}} />
          {sol.anexos && sol.anexos.length > 0 && <Anexos anexos={sol.anexos} />}
        </div>
      </div>

      <Produtos produtos={produtos} />
      <Historico historico={sol.historicoComunicacao} />

      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteBlocked ? "Exclusão não permitida" : "Excluir solicitação?"}
        message={deleteBlocked
          ? "Esta solicitação possui cadastros vinculados e não pode ser excluída."
          : deleteTarget?.anexos?.length > 0
            ? `Esta solicitação possui ${deleteTarget?.anexos?.length} link(s) anexado(s). Ao excluir, os links também serão removidos. Continuar?`
            : `Tem certeza que deseja excluir esta solicitação?`}
        subMessage={deleteBlocked
          ? "Remova ou desvincule os registros associados antes de excluir. Entre em contato com o administrador para mais informações."
          : undefined}
        confirmLabel={deleteBlocked ? "OK" : "Excluir"}
        variant={deleteBlocked ? "warning" : "danger"}
        loading={deleteLoading}
        onConfirm={() => {
          if (deleteBlocked) {
            setDeleteTarget(null)
            setDeleteBlocked(false)
            return
          }
          handleDelete()
        }}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteBlocked(false)
        }}
      />
    </div>
  )
}
