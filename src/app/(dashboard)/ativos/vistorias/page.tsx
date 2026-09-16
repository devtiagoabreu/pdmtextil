"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Loader2, Play } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { matchesSearch } from "@/components/ui/list-filters"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const STATUS_FILTROS = [
  "Todos",
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "NAO_CONFORME",
  "CANCELADA",
] as const

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  NAO_CONFORME: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELADA: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

type VistoriaStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "NAO_CONFORME" | "CANCELADA"

interface Vistoria {
  id: number
  ativoId: number
  ativoNome: string
  ativoCodigo: string
  tipoVistoriaId: number
  tipoVistoriaNome: string
  planoId: number | null
  status: VistoriaStatus
  dataProgramada: string
  dataRealizada: string | null
  resultado: string | null
  observacoes: string | null
  executadoPorId: number | null
  executadoPorNome: string | null
  createdAt: string
}

interface ChecklistItem {
  ordem: number
  pergunta: string
  tipo: "SIM_NAO" | "OK_OBS" | "VALOR" | "TEXTO"
  obrigatorio?: boolean
  unidade?: string
}

interface ChecklistResposta {
  pergunta: string
  tipo: ChecklistItem["tipo"]
  conforme: boolean | null
  observacao: string
}

interface Usuario {
  id: number
  name: string
}

function formatarData(data?: string | null): string {
  if (!data) return "—"
  const [ano, mes, dia] = data.slice(0, 10).split("-")
  return `${dia}/${mes}/${ano}`
}

export default function AtivosVistoriasPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [statusFiltro, setStatusFiltro] = useState<string>("Todos")
  const [apenasAtrasadas, setApenasAtrasadas] = useState(false)

  const [executando, setExecutando] = useState<Vistoria | null>(null)
  const [tipoChecklist, setTipoChecklist] = useState<ChecklistItem[] | null>(null)
  const [tipoLoading, setTipoLoading] = useState(false)
  const [checklistResposta, setChecklistResposta] = useState<ChecklistResposta[]>([])
  const [executadoPorId, setExecutadoPorId] = useState("")
  const [dataRealizada, setDataRealizada] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [resultado, setResultado] = useState("CONFORME")
  const [salvando, setSalvando] = useState(false)

  const {
    data: vistorias = [],
    isLoading,
    refetch,
  } = useQuery<Vistoria[]>({
    queryKey: ["ativos-vistorias"],
    queryFn: async () => {
      const res = await fetch("/api/ativos/vistorias")
      if (!res.ok) throw new Error("Falha ao carregar vistorias")
      return res.json()
    },
  })

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["usuarios-ativos"],
    queryFn: async () => {
      const res = await fetch("/api/usuarios/ativos")
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!executando,
  })

  useEffect(() => {
    if (!executando) return
    setExecutadoPorId("")
    setDataRealizada(new Date().toISOString().slice(0, 10))
    setObservacoes("")
    setResultado("CONFORME")
    setChecklistResposta([])
    setTipoChecklist(null)
    setTipoLoading(true)
    let ativo = true
    fetch(`/api/ativos/tipos-vistoria/${executando.tipoVistoriaId}`)
      .then((r) => r.json())
      .then((d) => {
        if (ativo) setTipoChecklist(Array.isArray(d.checklist) ? d.checklist : [])
      })
      .catch(() => {
        if (ativo) setTipoChecklist([])
      })
      .finally(() => {
        if (ativo) setTipoLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [executando])

  useEffect(() => {
    if (!tipoChecklist) return
    setChecklistResposta(
      tipoChecklist.map((item) => ({
        pergunta: item.pergunta,
        tipo: item.tipo,
        conforme: null,
        observacao: "",
      }))
    )
  }, [tipoChecklist])

  useEffect(() => {
    const respondidas = checklistResposta.filter((c) => c.conforme !== null)
    if (respondidas.length === 0) return
    const naoConformes = respondidas.filter((c) => c.conforme === false)
    if (naoConformes.length === 0) setResultado("CONFORME")
    else if (naoConformes.length === respondidas.length) setResultado("NAO_CONFORME")
    else setResultado("PARCIAL")
  }, [checklistResposta])

  const hoje = new Date().toISOString().slice(0, 10)

  const filtered = vistorias.filter((v: Vistoria) => {
    if (statusFiltro !== "Todos" && v.status !== statusFiltro) return false
    if (apenasAtrasadas) {
      const atrasada =
        v.status !== "CONCLUIDA" && v.status !== "CANCELADA" && v.dataProgramada <= hoje
      if (!atrasada) return false
    }
    return matchesSearch(v, search)
  })

  const isAtrasada = (v: Vistoria) =>
    v.status !== "CONCLUIDA" && v.status !== "CANCELADA" && v.dataProgramada <= hoje

  const atualizarChecklist = (idx: number, patch: Partial<ChecklistResposta>) => {
    setChecklistResposta((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const handleConcluir = async () => {
    if (!executando) return
    setSalvando(true)
    try {
      const body = {
        status: "CONCLUIDA",
        executadoPorId: executadoPorId ? parseInt(executadoPorId) : undefined,
        dataRealizada,
        resultado,
        checklistResposta: checklistResposta
          .filter((c) => c.conforme !== null)
          .map((c, idx) => ({
            ordem: idx,
            valor: c.tipo === "VALOR" || c.tipo === "TEXTO" ? c.observacao || null : null,
            observacao: c.observacao || undefined,
            conforme: c.conforme === true,
          })),
        observacoes: observacoes || null,
      }
      const res = await fetch(`/api/ativos/vistorias/${executando.id}/concluir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao concluir vistoria")
      }
      toast.success("Vistoria concluída com sucesso")
      setExecutando(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao concluir vistoria")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Vistorias (Agenda)
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe e execute as vistorias programadas dos ativos.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por ativo, código ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {STATUS_FILTROS.map((s) => (
            <Button
              key={s}
              variant={statusFiltro === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFiltro(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={apenasAtrasadas}
            onChange={(e) => setApenasAtrasadas(e.target.checked)}
            className="w-4 h-4"
          />
          Apenas atrasadas
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum registro encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Data Programada
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Ativo
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Tipo de Vistoria
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Resultado
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v: Vistoria) => (
                  <tr
                    key={v.id}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      isAtrasada(v)
                        ? "bg-red-50 dark:bg-red-950/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatarData(v.dataProgramada)}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-50">
                      {v.ativoNome}
                      {v.ativoCodigo && (
                        <span className="text-slate-400 ml-2">{v.ativoCodigo}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">{v.tipoVistoriaNome}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[v.status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{v.resultado || "—"}</td>
                    <td className="p-4 text-right">
                      {(v.status === "PENDENTE" || v.status === "EM_ANDAMENTO") && (
                        <Button size="sm" className="gap-2" onClick={() => setExecutando(v)}>
                          <Play size={14} />
                          Executar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!executando}
        onOpenChange={(next) => {
          if (!next) setExecutando(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Executar Vistoria — {executando?.ativoNome || ""}</DialogTitle>
            <DialogDescription>
              Registre a execução da vistoria preenchendo o checklist e os dados abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Executado por</Label>
                <Select value={executadoPorId} onValueChange={(v) => setExecutadoPorId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o executor" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data realizada</Label>
                <Input
                  type="date"
                  value={dataRealizada}
                  onChange={(e) => setDataRealizada(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Checklist</Label>
              {tipoLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                </div>
              ) : tipoChecklist && tipoChecklist.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Este tipo de vistoria não possui checklist.
                </p>
              ) : (
                tipoChecklist?.map((item, idx) => {
                  const resposta = checklistResposta[idx]
                  return (
                    <div
                      key={item.ordem}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {item.pergunta}
                      </p>
                      <RadioGroup
                        value={
                          resposta?.conforme === null || !resposta ? "" : String(resposta.conforme)
                        }
                        onValueChange={(v) =>
                          atualizarChecklist(idx, { conforme: v === "" ? null : v === "true" })
                        }
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="true" />
                          <Label className="font-normal">Conforme</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="false" />
                          <Label className="font-normal">Não conforme</Label>
                        </div>
                      </RadioGroup>
                      {(item.tipo === "OK_OBS" || item.tipo === "VALOR") && (
                        <div className="space-y-1.5">
                          <Label>
                            Observação
                            {item.tipo === "VALOR" && item.unidade ? ` (${item.unidade})` : ""}
                          </Label>
                          <Textarea
                            rows={2}
                            value={resposta?.observacao || ""}
                            onChange={(e) =>
                              atualizarChecklist(idx, { observacao: e.target.value })
                            }
                            placeholder={item.tipo === "VALOR" ? "Valor medido" : "Observações"}
                          />
                        </div>
                      )}
                      {item.tipo === "TEXTO" && (
                        <div className="space-y-1.5">
                          <Label>Resposta</Label>
                          <Textarea
                            rows={2}
                            value={resposta?.observacao || ""}
                            onChange={(e) =>
                              atualizarChecklist(idx, { observacao: e.target.value })
                            }
                            placeholder="Resposta da pergunta"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Resultado</Label>
              <Select value={resultado} onValueChange={(v) => setResultado(v || "CONFORME")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFORME">CONFORME</SelectItem>
                  <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                  <SelectItem value="NAO_CONFORME">NAO_CONFORME</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações gerais da vistoria"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setExecutando(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConcluir} disabled={salvando} className="gap-2">
              {salvando && <Loader2 size={14} className="animate-spin" />}
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
