"use client"

import type { MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronRight, FileText, FlaskConical, Loader2, Plus, Trash2 } from "lucide-react"
import { LinksEditor } from "@/components/links/LinksEditor"
import type { Acabamento, AcabamentoAmostra, Amostra, LinkItem, StatusOption } from "./types"

const TIPO_ACABAMENTO = ["TINGIMENTO", "ESTAMPARIA", "TERMOFIXACAO", "LAVAGEM", "OUTRO"]

interface Props {
  isEditing: boolean
  amostras: Amostra[]
  statusOptionsAmostra: StatusOption[]
  onUpdateStatusAmostra: (amostraId: number, novoStatus: string) => void
  onGerarPdfAmostra: (amostra: Amostra | AcabamentoAmostra, tipoAmostra: string) => void
  gerandoPdf: string | null
  onEditarAmostra: (a: Amostra) => void
  amostraLinksAberta: number | null
  setAmostraLinksAberta: (v: number | null) => void
  onSaveAmostraLinks: (amostraId: number, links: LinkItem[]) => void
  onExcluirAmostra: (a: Amostra) => void
  novaAmostraDescricao: string
  setNovaAmostraDescricao: (v: string) => void
  novaAmostraObs: string
  setNovaAmostraObs: (v: string) => void
  novaAmostraQtd: string
  setNovaAmostraQtd: (v: string) => void
  novaAmostraErp: string
  setNovaAmostraErp: (v: string) => void
  onAddAmostra: () => void
  acabamentos: Acabamento[]
  expandedAcabamento: number | null
  setExpandedAcabamento: (v: number | null) => void
  expandedAmostraForm: number | null
  setExpandedAmostraForm: (v: number | null) => void
  onUpdateStatusAmostraAcabamento: (acabamentoId: number, asid: number, novoStatus: string) => void
  acabAmostraLinksAberta: string | null
  setAcabAmostraLinksAberta: (v: string | null) => void
  onSaveAcabAmostraLinks: (acabamentoId: number, amostraId: number, links: LinkItem[]) => void
  onExcluirAcabamento: (a: Acabamento) => void
  onExcluirAmostraAcabamento: (acabamentoId: number, asid: number) => void
  novoAcabamentoTipo: string
  setNovoAcabamentoTipo: (v: string) => void
  novoAcabamentoDescricao: string
  setNovoAcabamentoDescricao: (v: string) => void
  novoAcabamentoErp: string
  setNovoAcabamentoErp: (v: string) => void
  onAddAcabamento: () => void
  novaAmostraAcabDescricao: string
  setNovaAmostraAcabDescricao: (v: string) => void
  novaAmostraAcabQtd: string
  setNovaAmostraAcabQtd: (v: string) => void
  onAddAmostraAcabamento: (acabamentoId: number) => void
  onAbrirReceita: (acabamentoId: number, amostraId: number) => void
}

export function AmostrasTab({
  isEditing,
  amostras,
  statusOptionsAmostra,
  onUpdateStatusAmostra,
  onGerarPdfAmostra,
  gerandoPdf,
  onEditarAmostra,
  amostraLinksAberta,
  setAmostraLinksAberta,
  onSaveAmostraLinks,
  onExcluirAmostra,
  novaAmostraDescricao,
  setNovaAmostraDescricao,
  novaAmostraObs,
  setNovaAmostraObs,
  novaAmostraQtd,
  setNovaAmostraQtd,
  novaAmostraErp,
  setNovaAmostraErp,
  onAddAmostra,
  acabamentos,
  expandedAcabamento,
  setExpandedAcabamento,
  expandedAmostraForm,
  setExpandedAmostraForm,
  onUpdateStatusAmostraAcabamento,
  acabAmostraLinksAberta,
  setAcabAmostraLinksAberta,
  onSaveAcabAmostraLinks,
  onExcluirAcabamento,
  onExcluirAmostraAcabamento,
  novoAcabamentoTipo,
  setNovoAcabamentoTipo,
  novoAcabamentoDescricao,
  setNovoAcabamentoDescricao,
  novoAcabamentoErp,
  setNovoAcabamentoErp,
  onAddAcabamento,
  novaAmostraAcabDescricao,
  setNovaAmostraAcabDescricao,
  novaAmostraAcabQtd,
  setNovaAmostraAcabQtd,
  onAddAmostraAcabamento,
  onAbrirReceita,
}: Props) {
  if (!isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-slate-500">
        Salve o produto primeiro para gerenciar amostras e acabamentos.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 id="amostras" className="text-lg font-semibold">Amostras (Tecido Cru)</h2>

        {amostras.length > 0 && (
          <div className="space-y-2">
            {amostras.map((a) => (
              <div key={a.id} id={`amostra-${a.id}`}>
                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{a.descricao || "Sem descrição"}</p>
                      {a.quantidadeProduzida ? (
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">Qtd: {a.quantidadeProduzida}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Qtd: -</span>
                      )}
                      {a.idIntegracaoErpCru ? (
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">ERP: {a.idIntegracaoErpCru}</span>
                      ) : (
                        <span className="text-xs text-slate-400">ERP: -</span>
                      )}
                      {a.dados?.tear ? (
                        <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">Tear: {a.dados.tear}</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {a.observacoes && (
                        <span className="text-slate-400">{a.observacoes}</span>
                      )}
                      <select
                        value={a.status}
                        onChange={e => onUpdateStatusAmostra(a.id, e.target.value)}
                        className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium ml-1 cursor-pointer ${
                          a.status.startsWith("APROVADA") ? "bg-green-100 text-green-700" :
                          a.status === "REPROVADA" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {statusOptionsAmostra.map((s) => (
                          <option key={s.value} value={s.value} className="bg-white text-slate-900">{s.label}</option>
                        ))}
                      </select>
                      {a.motivoAprovacao && (
                        <span className="text-slate-400 italic ml-2">Motivo: {a.motivoAprovacao}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => onGerarPdfAmostra(a, "TECIDO_CRU")} disabled={gerandoPdf === `TECIDO_CRU-${a.id}`}>
                      {gerandoPdf === `TECIDO_CRU-${a.id}` ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      Solic. Amostra
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => onEditarAmostra(a)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setAmostraLinksAberta(amostraLinksAberta === a.id ? null : a.id)}>
                      Links {a.links?.length ? `(${a.links.length})` : ""}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onExcluirAmostra(a)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                {amostraLinksAberta === a.id && (
                  <div className="ml-4 mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                    <LinksEditor
                      links={a.links || []}
                      onChange={links => onSaveAmostraLinks(a.id, links)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="space-y-1 flex-1">
            <Label>Descrição</Label>
            <Input value={novaAmostraDescricao} onChange={e => setNovaAmostraDescricao(e.target.value)} placeholder="AMOSTRA - PILOTAGEM 001" />
          </div>
          <div className="space-y-1 flex-1">
            <Label>Observações</Label>
            <Input value={novaAmostraObs} onChange={e => setNovaAmostraObs(e.target.value)} placeholder="Observações" />
          </div>
          <div className="space-y-1 w-28">
            <Label>Qtd Produzida</Label>
            <Input value={novaAmostraQtd} onChange={e => setNovaAmostraQtd(e.target.value)} placeholder="10 M" />
          </div>
          <div className="space-y-1 w-36">
            <Label>ERP (Cru)</Label>
            <Input value={novaAmostraErp} onChange={e => setNovaAmostraErp(e.target.value)} placeholder="ERP.00001" />
          </div>
          <Button onClick={onAddAmostra} size="sm"><Plus size={16} /></Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Acabamentos</h2>
        </div>

        {acabamentos.length > 0 && (
          <div className="space-y-3">
            {acabamentos.map((acab) => (
              <div key={acab.id} className="rounded-xl border border-slate-200 dark:border-slate-800">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  onClick={() => setExpandedAcabamento(expandedAcabamento === acab.id ? null : acab.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedAcabamento === acab.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="font-medium">{acab.tipoAcabamento}</span>
                    <span className="text-sm text-slate-500">{acab.descricao}</span>
                    {acab.idIntegracaoErpAcabado && (
                      <span className="text-xs text-slate-400">ERP: {acab.idIntegracaoErpAcabado}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onExcluirAcabamento(acab) }}>
                    <Trash2 size={16} />
                  </Button>
                </div>

                {expandedAcabamento === acab.id && (
                  <div className="p-4 border-t space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Amostras</h3>
                        <Button size="sm" variant="outline" onClick={() => setExpandedAmostraForm(expandedAmostraForm === acab.id ? null : acab.id)}>
                          <Plus size={14} /> Amostra
                        </Button>
                      </div>
                      {acab.amostras.map((as) => {
                        const key = `${acab.id}-${as.id}`
                        return (
                          <div key={as.id} id={`amostra-acab-${acab.id}-${as.id}`}>
                            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded mb-1">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm">{as.descricao || "Sem descrição"}</span>
                                {as.dados?.tear && (
                                  <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded ml-2">Tear: {as.dados.tear}</span>
                                )}
                                {as.quantidadeProduzida && (
                                  <span className="text-xs text-slate-400 ml-2">Qtd: {as.quantidadeProduzida}</span>
                                )}
                                {as.motivoAprovacao && (
                                  <p className="text-xs text-slate-400 italic truncate">Motivo: {as.motivoAprovacao}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => onGerarPdfAmostra(as, "ACABAMENTO")} disabled={gerandoPdf === `ACABAMENTO-${as.id}`}>
                                  {gerandoPdf === `ACABAMENTO-${as.id}` ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setAcabAmostraLinksAberta(acabAmostraLinksAberta === key ? null : key)}>
                                  Links {as.links?.length ? `(${as.links.length})` : ""}
                                </Button>
                                <select
                                  value={as.status}
                                  onChange={e => onUpdateStatusAmostraAcabamento(acab.id, as.id, e.target.value)}
                                  className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${
                                    as.status.startsWith("APROVADA") ? "bg-green-100 text-green-700" :
                                    as.status === "REPROVADA" ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {statusOptionsAmostra.map((s) => (
                                    <option key={s.value} value={s.value} className="bg-white text-slate-900">{s.label}</option>
                                  ))}
                                </select>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onExcluirAmostraAcabamento(acab.id, as.id)}>
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                            {acabAmostraLinksAberta === key && (
                              <div className="ml-4 mb-2 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                <LinksEditor
                                  links={as.links || []}
                                  onChange={links => onSaveAcabAmostraLinks(acab.id, as.id, links)}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {expandedAmostraForm === acab.id && (
                        <div className="flex gap-2 mt-2">
                          <Input value={novaAmostraAcabDescricao} onChange={e => setNovaAmostraAcabDescricao(e.target.value)} placeholder="Descrição da amostra" />
                          <Input value={novaAmostraAcabQtd} onChange={e => setNovaAmostraAcabQtd(e.target.value)} placeholder="Qtd produzida" className="w-32" />
                          <Button size="sm" onClick={() => onAddAmostraAcabamento(acab.id)}>Adicionar</Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 border-t pt-3">
                      <h3 className="text-sm font-medium mb-2">Receitas de Beneficiamento</h3>
                      <div className="space-y-1">
                        {acab.amostras.map((as) => (
                          <div key={as.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-sm">
                            <span className="text-slate-600">
                              {as.descricao || `Amostra #${as.id}`}
                              {as.dados?.tear && <span className="text-xs text-amber-500 ml-1">[Tear: {as.dados.tear}]</span>}
                              <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${
                                as.status.startsWith("APROVADA") ? "bg-green-100 text-green-700" :
                                as.status === "REPROVADA" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>{as.status}</span>
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => onAbrirReceita(acab.id, as.id)}>
                              <FlaskConical size={14} className="mr-1" /> Receita
                            </Button>
                          </div>
                        ))}
                        {acab.amostras.length === 0 && (
                          <p className="text-xs text-slate-400 italic">Nenhuma amostra ainda</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label>Tipo Acabamento</Label>
            <select value={novoAcabamentoTipo} onChange={e => setNovoAcabamentoTipo(e.target.value)}
              className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
              {TIPO_ACABAMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1">
            <Label>Descrição</Label>
            <Input value={novoAcabamentoDescricao} onChange={e => setNovoAcabamentoDescricao(e.target.value)} placeholder="Tinto Branco" />
          </div>
          <div className="space-y-1 flex-1">
            <Label>ERP (Acabado)</Label>
            <Input value={novoAcabamentoErp} onChange={e => setNovoAcabamentoErp(e.target.value)} placeholder="2.K1820.TIN.000001" />
          </div>
          <Button onClick={onAddAcabamento} size="sm"><Plus size={16} /> Acabamento</Button>
        </div>
      </div>
    </div>
  )
}
