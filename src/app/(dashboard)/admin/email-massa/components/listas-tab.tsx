"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Pencil, Eye, Trash2, X } from "lucide-react"
import { ImportarEntidade } from "@/components/importar/ImportarEntidade"
import type { Lista, ListaComContatos, Contato } from "../types"

export interface ListasTabProps {
  onListaDeletada: (id: number) => void
}

const MAX_CONTATOS_EXIBIDOS = 200

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function ListasTab({ onListaDeletada }: ListasTabProps) {
  const queryClient = useQueryClient()

  const { data: listas = [], isLoading: loadingListas } = useQuery<Lista[]>({
    queryKey: ["email-massa-listas"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-massa/listas")
      if (!res.ok) return []
      return res.json()
    },
  })

  const [listaDialogOpen, setListaDialogOpen] = useState(false)
  const [editLista, setEditLista] = useState<ListaComContatos | null>(null)
  const [listaForm, setListaForm] = useState({ nome: "", descricao: "" })
  const [listaContatos, setListaContatos] = useState<Contato[]>([])
  const [novoContato, setNovoContato] = useState({ nome: "", email: "" })
  const [editContatoId, setEditContatoId] = useState<number | null>(null)
  const [viewLista, setViewLista] = useState<ListaComContatos | null>(null)
  const [buscaContato, setBuscaContato] = useState("")

  const emailsDuplicados = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of listaContatos) {
      const chave = normalizeEmail(c.email)
      counts.set(chave, (counts.get(chave) || 0) + 1)
    }
    const duplicados = new Set<string>()
    for (const [chave, n] of counts) {
      if (n > 1) duplicados.add(chave)
    }
    return duplicados
  }, [listaContatos])

  const buscaNorm = buscaContato.trim().toLowerCase()
  const contatosFiltrados = useMemo(() => {
    if (!buscaNorm) return listaContatos
    return listaContatos.filter((c) =>
      normalizeEmail(c.email).includes(buscaNorm) || c.nome.toLowerCase().includes(buscaNorm)
    )
  }, [listaContatos, buscaNorm])

  const contatosExibidos = contatosFiltrados.slice(0, MAX_CONTATOS_EXIBIDOS)
  const contatosOcultos = contatosFiltrados.length - contatosExibidos.length

  const salvarLista = async () => {
    if (!listaForm.nome) { toast.error("Informe o nome da lista"); return }
    try {
      const url = editLista
        ? `/api/admin/email-massa/listas/${editLista.id}`
        : "/api/admin/email-massa/listas"
      const method = editLista ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(listaForm) })
      if (res.ok) {
        const data = await res.json()
        const listaId = editLista ? editLista.id : data.id

        if (listaContatos.length > 0) {
          await fetch(`/api/admin/email-massa/listas/${listaId}/contatos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contatos: listaContatos.map((c: any) => ({ nome: c.nome, email: c.email })) }),
          })
        }

        toast.success(editLista ? "Lista atualizada" : "Lista criada")
        setListaDialogOpen(false)
        setEditLista(null)
        setListaForm({ nome: "", descricao: "" })
        setListaContatos([])
        queryClient.invalidateQueries({ queryKey: ["email-massa-listas"] })
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao salvar")
      }
    } catch {
      toast.error("Erro ao salvar lista")
    }
  }

  const deletarLista = async (id: number) => {
    if (!confirm("Deletar esta lista e todos os seus contatos?")) return
    try {
      const res = await fetch(`/api/admin/email-massa/listas/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Lista deletada")
        queryClient.invalidateQueries({ queryKey: ["email-massa-listas"] })
        onListaDeletada(id)
      }
    } catch {
      toast.error("Erro ao deletar")
    }
  }

  const abrirEditarLista = async (l: Lista) => {
    try {
      const res = await fetch(`/api/admin/email-massa/listas/${l.id}`)
      if (res.ok) {
        const data = await res.json()
        setEditLista(data)
        setListaForm({ nome: data.nome, descricao: data.descricao || "" })
        setListaContatos(data.contatos || [])
        setListaDialogOpen(true)
      }
    } catch {
      toast.error("Erro ao carregar lista")
    }
  }

  const abrirNovaLista = () => {
    setEditLista(null)
    setListaForm({ nome: "", descricao: "" })
    setListaContatos([])
    setListaDialogOpen(true)
  }

  const abrirVerLista = async (l: Lista) => {
    try {
      const res = await fetch(`/api/admin/email-massa/listas/${l.id}`)
      if (res.ok) setViewLista(await res.json())
    } catch {
      toast.error("Erro ao carregar lista")
    }
  }

  const adicionarContato = () => {
    if (!novoContato.nome || !novoContato.email) {
      toast.error("Preencha nome e email do contato")
      return
    }
    if (!novoContato.email.includes("@")) {
      toast.error("Email inválido")
      return
    }
    if (editContatoId) {
      setListaContatos(prev => prev.map((c: any) =>
        c.id === editContatoId ? { ...c, nome: novoContato.nome, email: novoContato.email } : c
      ))
      setEditContatoId(null)
    } else {
      setListaContatos(prev => [...prev, { ...novoContato, id: Date.now(), listaId: editLista?.id || 0 }])
    }
    setNovoContato({ nome: "", email: "" })
  }

  const editarContato = (c: Contato) => {
    setNovoContato({ nome: c.nome, email: c.email })
    setEditContatoId(c.id)
  }

  const cancelarEdicaoContato = () => {
    setEditContatoId(null)
    setNovoContato({ nome: "", email: "" })
  }

  const removerContato = (id: number) => {
    setListaContatos(prev => prev.filter((c: any) => c.id !== id))
  }

  const removerFiltrados = () => {
    if (!buscaNorm) return
    const removidos = contatosFiltrados.length
    setListaContatos(prev => prev.filter((c) => {
      const k = normalizeEmail(c.email)
      const n = c.nome.toLowerCase()
      return !k.includes(buscaNorm) && !n.includes(buscaNorm)
    }))
    toast.success(`Removidos ${removidos} contato(s)`)
  }

  const limparEmailsRepetidos = () => {
    const vistos = new Set<string>()
    const mantidos: Contato[] = []
    for (const c of listaContatos) {
      const chave = normalizeEmail(c.email)
      if (!vistos.has(chave)) {
        vistos.add(chave)
        mantidos.push(c)
      }
    }
    const removidos = listaContatos.length - mantidos.length
    setListaContatos(mantidos)
    toast.success(`Removidos ${removidos} email(s) repetido(s)`)
  }

  return (
    <>
      <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Listas de Destinatários</h2>
            <Button onClick={abrirNovaLista} className="gap-1"><Plus size={14} /> Nova Lista</Button>
          </div>

          {loadingListas ? (
            <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
          ) : listas.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Nenhuma lista cadastrada. Clique em &ldquo;Nova Lista&rdquo; para criar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left font-medium p-2">Nome</th>
                    <th className="text-left font-medium p-2">Descrição</th>
                    <th className="text-center font-medium p-2 w-24">Contatos</th>
                    <th className="text-right font-medium p-2 w-64">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listas.map((l: any) => (
                    <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium">{l.nome}</td>
                      <td className="p-2 text-slate-500 truncate max-w-xs">{l.descricao || "—"}</td>
                      <td className="p-2 text-center"><span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{l.totalContatos}</span></td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <div className="flex gap-1 justify-end items-center">
                          <ImportarEntidade
                            config={{ titulo: "Contatos", apiBase: `admin/email-massa/listas/${l.id}`, arquivoPrefixo: "contatos_email" }}
                            onImportado={() => queryClient.invalidateQueries({ queryKey: ["email-massa-listas"] })}
                            buttonVariant="compact"
                            titleSuffix={l.nome}
                            apiImportConfig={{ tela: "email-listas", existingKey: "email", extraImportParams: { listaId: l.id }, buscarExistentes: async () => {
                              try {
                                const res = await fetch(`/api/admin/email-massa/listas/${l.id}`)
                                if (!res.ok) return []
                                const data = await res.json()
                                return data.contatos || []
                              } catch {
                                return []
                              }
                            } }}
                          />
                          <Button variant="ghost" size="xs" onClick={() => abrirEditarLista(l)} aria-label={`Editar lista ${l.nome}`} className="gap-1"><Pencil size={12} /></Button>
                          <Button variant="ghost" size="xs" onClick={() => abrirVerLista(l)} aria-label={`Ver lista ${l.nome}`} className="gap-1"><Eye size={12} /></Button>
                          <Button variant="ghost" size="xs" onClick={() => deletarLista(l.id)} aria-label={`Deletar lista ${l.nome}`} className="gap-1 text-red-500 hover:text-red-700"><Trash2 size={12} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─────── DIALOG LISTA ─────── */}
      <Dialog open={listaDialogOpen} onOpenChange={setListaDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editLista ? "Editar Lista" : "Nova Lista"}</DialogTitle>
            <DialogDescription>{editLista ? "Edite os dados da lista e seus contatos" : "Crie uma nova lista de destinatários"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Lista</Label>
              <Input value={listaForm.nome} onChange={e => setListaForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Newsletter Clientes" />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={listaForm.descricao} onChange={e => setListaForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição da lista" className="min-h-[60px]" />
            </div>

            <Separator />

            <div>
              <Label>Contatos</Label>
              <div className="flex gap-2 mt-1 mb-2">
                <Input value={novoContato.nome} onChange={e => setNovoContato(p => ({ ...p, nome: e.target.value }))} placeholder="Nome" className="flex-1" />
                <Input value={novoContato.email} onChange={e => setNovoContato(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="flex-[2]" />
                <Button variant="outline" size="sm" onClick={adicionarContato} className="gap-1 shrink-0">
                  {editContatoId ? <Pencil size={14} /> : <Plus size={14} />}
                  {editContatoId ? "Salvar" : "Adicionar"}
                </Button>
                {editContatoId && (
                  <Button variant="ghost" size="sm" onClick={cancelarEdicaoContato} className="shrink-0">
                    <X size={14} /> Cancelar
                  </Button>
                )}
              </div>

              <div className="flex gap-2 mt-1 mb-2">
                <Input
                  value={buscaContato}
                  onChange={e => setBuscaContato(e.target.value)}
                  placeholder="Buscar contato por nome ou email"
                  aria-label="Buscar contato por nome ou email"
                  className="flex-1"
                />
                {buscaNorm && contatosFiltrados.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={removerFiltrados} className="gap-1 shrink-0">
                    <Trash2 size={14} /> Remover {contatosFiltrados.length} encontrado(s)
                  </Button>
                )}
              </div>

              {emailsDuplicados.size > 0 && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 mb-2">
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    {emailsDuplicados.size} email(s) repetido(s) na lista — mantém 1 contato por email
                  </span>
                  <Button variant="outline" size="xs" onClick={limparEmailsRepetidos} className="gap-1 shrink-0">
                    <Trash2 size={12} /> Limpar emails repetidos
                  </Button>
                </div>
              )}

              {contatosFiltrados.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  {buscaNorm ? "Nenhum contato encontrado para a busca" : "Nenhum contato adicionado"}
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <th className="text-left font-medium p-2">Nome</th>
                        <th className="text-left font-medium p-2">Email</th>
                        <th className="text-center font-medium p-2 w-20">Repetido</th>
                        <th className="w-14 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {contatosExibidos.map((c: any) => {
                        const repetido = emailsDuplicados.has(normalizeEmail(c.email))
                        return (
                          <tr key={c.id} className={`border-b border-slate-100 dark:border-slate-800 ${repetido ? "bg-amber-50 dark:bg-amber-900/10" : ""}`}>
                            <td className="p-2">{c.nome}</td>
                            <td className="p-2 text-slate-500 break-all max-w-0">{c.email}</td>
                            <td className="p-2 text-center">
                              {repetido && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                  repetido
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <button onClick={() => editarContato(c)} aria-label={`Editar contato ${c.nome}`} className="text-blue-400 hover:text-blue-600"><Pencil size={14} /></button>
                                <button onClick={() => removerContato(c.id)} aria-label={`Remover contato ${c.nome}`} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {contatosFiltrados.length} contato(s)
                {contatosOcultos > 0 && ` — exibindo ${contatosExibidos.length}, use a busca para refinar`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={salvarLista}>{editLista ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG VER LISTA ─────── */}
      <Dialog open={!!viewLista} onOpenChange={() => setViewLista(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewLista?.nome}</DialogTitle>
            <DialogDescription>{viewLista?.descricao || "Sem descrição"} — {viewLista?.contatos?.length || 0} contato(s)</DialogDescription>
          </DialogHeader>
          {viewLista && viewLista.contatos && viewLista.contatos.length > 0 ? (
            <div className="max-h-64 overflow-y-auto border rounded-lg border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <th className="text-left font-medium p-2">Nome</th>
                    <th className="text-left font-medium p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {viewLista.contatos.slice(0, MAX_CONTATOS_EXIBIDOS).map((c: any) => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2">{c.nome}</td>
                      <td className="p-2 text-slate-500">{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhum contato nesta lista</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLista(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ListasTab
