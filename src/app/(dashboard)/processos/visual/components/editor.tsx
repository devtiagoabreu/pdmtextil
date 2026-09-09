"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  FileCode2,
  Braces,
  Download,
  Copy,
  ArrowRight,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DIAGRAMA_TIPO_LABELS } from "@/lib/processos/constantes"
import type { CanvasExcalidraw, ModeloProcesso } from "@/lib/processos/diagrama/types"
import { modeloVazio } from "@/lib/processos/diagrama/modelo-semantico"
import { modeloParaMermaid, mermaidParaModelo } from "@/lib/processos/diagrama/mermaid"
import { modeloParaMarkdown } from "@/lib/processos/diagrama/markdown"
import { modeloParaBpmn } from "@/lib/processos/diagrama/bpmn"
import { modeloParaCanvasExcalidraw } from "@/lib/processos/diagrama/excalidraw"

const BpmnEditor = dynamic(() => import("@/components/processos/bpmn-editor"), { ssr: false })
const CanvasExcalidrawEditor = dynamic(() => import("@/components/processos/canvas-excalidraw"), {
  ssr: false,
})

export interface DiagramaRegistro {
  id: number
  nome: string
  tipo: string
  descricao?: string | null
  modelo: unknown
  mermaid?: string | null
  markdown?: string | null
  bpmnXml?: string | null
  canvas: unknown
  ativo: boolean
}

type Aba = "SEMANTICO" | "MERMAID" | "BPMN" | "CANVAS" | "EXPORTAR"

const ABAS: Array<{ key: Aba; nome: string }> = [
  { key: "SEMANTICO", nome: "Modelo semântico" },
  { key: "MERMAID", nome: "Texto Mermaid" },
  { key: "BPMN", nome: "BPMN" },
  { key: "CANVAS", nome: "Canvas" },
  { key: "EXPORTAR", nome: "Exportar" },
]

interface ModeloCompleto extends ModeloProcesso {}

function normalizarModelo(modelo: unknown): ModeloCompleto {
  if (modelo && typeof modelo === "object") {
    const m = modelo as Partial<ModeloCompleto>
    return {
      schemaVersion: "1",
      nome: m.nome ?? "",
      objetivo: m.objetivo ?? "",
      atividades: Array.isArray(m.atividades) ? m.atividades : [],
      decisoes: Array.isArray(m.decisoes) ? m.decisoes : [],
      fluxos: Array.isArray(m.fluxos) ? m.fluxos : [],
    }
  }
  return modeloVazio()
}

function baixar(nomeArquivo: string, conteudo: string, mime = "text/plain") {
  const blob = new Blob([conteudo], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    toast.success("Copiado para a área de transferência")
  } catch {
    toast.error("Não foi possível copiar")
  }
}

interface EditorProps {
  diagrama: DiagramaRegistro
  onAtualizada?: (diagrama: DiagramaRegistro) => void
}

export default function EditorDiagrama({ diagrama, onAtualizada }: EditorProps) {
  const [nome, setNome] = useState(diagrama.nome)
  const [tipo, setTipo] = useState(diagrama.tipo || "FLUXOGRAMA")
  const [descricao, setDescricao] = useState(diagrama.descricao || "")
  const [ativo, setAtivo] = useState(diagrama.ativo)
  const [modelo, setModelo] = useState<ModeloCompleto>(() => normalizarModelo(diagrama.modelo))
  const [mermaidOverride, setMermaidOverride] = useState<string | null>(null)
  const [bpmnXml, setBpmnXml] = useState<string>(() => diagrama.bpmnXml ?? modeloParaBpmn(normalizarModelo(diagrama.modelo)))
  const [canvas, setCanvas] = useState<CanvasExcalidraw | null>(
    () => (diagrama.canvas as CanvasExcalidraw | null) ?? null
  )
  const [aba, setAba] = useState<Aba>("SEMANTICO")
  const [saving, setSaving] = useState(false)

  const mermaidAtual = useMemo(() => modeloParaMermaid(modelo, tipo), [modelo, tipo])
  const markdownAtual = useMemo(() => modeloParaMarkdown(modelo), [modelo])
  const mermaidMostrada = mermaidOverride ?? mermaidAtual

  const opcoesNodos = useMemo(() => {
    const opcoes: Array<{ id: string; nome: string }> = [{ id: "inicio", nome: "Início" }]
    for (const a of modelo.atividades) opcoes.push({ id: a.id, nome: a.nome || a.id })
    for (const d of modelo.decisoes) opcoes.push({ id: d.id, nome: d.pergunta || d.id })
    opcoes.push({ id: "fim", nome: "Fim" })
    return opcoes
  }, [modelo])

  async function salvar(corpo: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/processos/diagramas/${diagrama.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      const atualizada = (await res.json()) as DiagramaRegistro
      toast.success("Diagrama salvo com sucesso")
      if (nome !== atualizada.nome) setNome(atualizada.nome)
      setModelo(normalizarModelo(atualizada.modelo ?? null))
      setMermaidOverride(null)
      setBpmnXml(atualizada.bpmnXml ?? modeloParaBpmn(normalizarModelo(atualizada.modelo ?? null)))
      setCanvas((atualizada.canvas as CanvasExcalidraw | null) ?? null)
      onAtualizada?.(atualizada)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  function salvarSemantico() {
    salvar({ nome, tipo, descricao, ativo, modelo })
  }

  function salvarMermaid() {
    salvar({ nome, tipo, descricao, ativo, mermaid: mermaidMostrada })
  }

  function salvarBpmn() {
    salvar({ nome, tipo, descricao, ativo, modelo, bpmnXml })
  }

  function salvarCanvas() {
    salvar({ nome, tipo, descricao, ativo, modelo, canvas })
  }

  function importarMermaid() {
    const parse = mermaidParaModelo(mermaidMostrada)
    if (!parse.modelo) {
      toast.error(parse.erro || "Texto Mermaid inválido.")
      return
    }
    setModelo(normalizarModelo(parse.modelo))
    setMermaidOverride(mermaidMostrada)
    toast.success("Modelo importado do texto Mermaid")
  }

  function gerarBpmnDoModelo() {
    setBpmnXml(modeloParaBpmn(modelo))
    toast.success("BPMN gerado a partir do modelo")
  }

  function gerarCanvasDoModelo() {
    setCanvas(modeloParaCanvasExcalidraw(modelo))
    toast.success("Canvas gerado a partir do modelo")
  }

  function adicionarAtividade() {
    setModelo((m) => ({
      ...m,
      atividades: [...m.atividades, { id: `A${m.atividades.length + 1}`, nome: "" }],
    }))
  }

  function atualizarAtividade(id: string, campo: "nome" | "responsavel" | "sistema", valor: string) {
    setModelo((m) => ({
      ...m,
      atividades: m.atividades.map((a) => (a.id === id ? { ...a, [campo]: valor } : a)),
    }))
  }

  function removerAtividade(id: string) {
    setModelo((m) => ({
      ...m,
      atividades: m.atividades.filter((a) => a.id !== id),
      fluxos: m.fluxos.filter((f) => f.de !== id && f.para !== id),
    }))
  }

  function adicionarDecisao() {
    setModelo((m) => ({
      ...m,
      decisoes: [...m.decisoes, { id: `D${m.decisoes.length + 1}`, pergunta: "" }],
    }))
  }

  function atualizarDecisao(id: string, pergunta: string) {
    setModelo((m) => ({
      ...m,
      decisoes: m.decisoes.map((d) => (d.id === id ? { ...d, pergunta } : d)),
    }))
  }

  function removerDecisao(id: string) {
    setModelo((m) => ({
      ...m,
      decisoes: m.decisoes.filter((d) => d.id !== id),
      fluxos: m.fluxos.filter((f) => f.de !== id && f.para !== id),
    }))
  }

  function adicionarFluxo() {
    const atividadesNaoConectadas = modelo.atividades.filter(
      (a) => !modelo.fluxos.some((f) => f.de === a.id || f.para === a.id)
    )
    const origem = atividadesNaoConectadas[0]?.id ?? "inicio"
    const destino = modelo.atividades.find((a) => a.id !== origem)?.id ?? "fim"
    setModelo((m) => ({
      ...m,
      fluxos: [...m.fluxos, { id: `F${m.fluxos.length + 1}`, de: origem, para: destino, rotulo: "" }],
    }))
  }

  function atualizarFluxo(id: string, campo: "de" | "para" | "rotulo", valor: string) {
    setModelo((m) => ({
      ...m,
      fluxos: m.fluxos.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)),
    }))
  }

  function removerFluxo(id: string) {
    setModelo((m) => ({ ...m, fluxos: m.fluxos.filter((f) => f.id !== id) }))
  }

  const jsonModelo = useMemo(() => JSON.stringify(modelo, null, 2), [modelo])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ed-nome">Nome *</Label>
            <Input id="ed-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Fluxograma de recebimento" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ed-tipo">Tipo de diagrama</Label>
            <select
              id="ed-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {Object.entries(DIAGRAMA_TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ed-descricao">Descrição</Label>
            <Input id="ed-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4" />
            Ativo
          </label>
          <span className="text-xs text-slate-400">Um conhecimento, múltiplas representações.</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ABAS.map((t) => (
          <button
            key={t.key}
            onClick={() => setAba(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              aba === t.key
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t.nome}
          </button>
        ))}
      </div>

      {aba === "SEMANTICO" && (
        <div className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="md-nome">Nome do processo</Label>
              <Input
                id="md-nome"
                value={modelo.nome ?? ""}
                onChange={(e) => setModelo((m) => ({ ...m, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="md-objetivo">Objetivo</Label>
              <Input
                id="md-objetivo"
                value={modelo.objetivo ?? ""}
                onChange={(e) => setModelo((m) => ({ ...m, objetivo: e.target.value }))}
              />
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Atividades</h3>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={adicionarAtividade}>
                <Plus size={14} /> Atividade
              </Button>
            </div>
            {modelo.atividades.length === 0 && (
              <p className="text-sm text-slate-400">Nenhuma atividade ainda. Use o botão acima para adicionar.</p>
            )}
            <div className="space-y-2">
              {modelo.atividades.map((a) => (
                <div key={a.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                  <div className="w-10 pt-4 text-xs font-mono text-slate-400">{a.id}</div>
                  <div className="flex-1 min-w-[180px]">
                    <Input
                      aria-label={`Nome da atividade ${a.id}`}
                      value={a.nome}
                      onChange={(e) => atualizarAtividade(a.id, "nome", e.target.value)}
                      placeholder="Nome da atividade"
                    />
                  </div>
                  <div className="w-44">
                    <Input
                      aria-label={`Responsável ${a.id}`}
                      value={a.responsavel ?? ""}
                      onChange={(e) => atualizarAtividade(a.id, "responsavel", e.target.value)}
                      placeholder="Responsável"
                    />
                  </div>
                  <div className="w-44">
                    <Input
                      aria-label={`Sistema ${a.id}`}
                      value={a.sistema ?? ""}
                      onChange={(e) => atualizarAtividade(a.id, "sistema", e.target.value)}
                      placeholder="Sistema"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600"
                    onClick={() => removerAtividade(a.id)}
                    aria-label={`Remover atividade ${a.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Decisões</h3>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={adicionarDecisao}>
                <Plus size={14} /> Decisão
              </Button>
            </div>
            {modelo.decisoes.length === 0 && (
              <p className="text-sm text-slate-400">Nenhuma decisão ainda.</p>
            )}
            <div className="space-y-2">
              {modelo.decisoes.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                  <div className="w-10 text-xs font-mono text-slate-400">{d.id}</div>
                  <Input
                    aria-label={`Pergunta da decisão ${d.id}`}
                    value={d.pergunta}
                    onChange={(e) => atualizarDecisao(d.id, e.target.value)}
                    placeholder="Pergunta da decisão (ex.: NF conferida?)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600"
                    onClick={() => removerDecisao(d.id)}
                    aria-label={`Remover decisão ${d.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Fluxos</h3>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={adicionarFluxo}>
                <Plus size={14} /> Fluxo
              </Button>
            </div>
            {modelo.fluxos.length === 0 && (
              <p className="text-sm text-slate-400">Nenhum fluxo ainda. Ligue atividades, decisões, Início e Fim.</p>
            )}
            <div className="space-y-2">
              {modelo.fluxos.map((f) => (
                <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                  <div className="w-10 text-xs font-mono text-slate-400">{f.id}</div>
                  <select
                    aria-label={`Origem do fluxo ${f.id}`}
                    value={f.de}
                    onChange={(e) => atualizarFluxo(f.id, "de", e.target.value)}
                    className="w-40 p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm"
                  >
                    {opcoesNodos.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                  <ArrowRight size={14} className="text-slate-400" />
                  <select
                    aria-label={`Destino do fluxo ${f.id}`}
                    value={f.para}
                    onChange={(e) => atualizarFluxo(f.id, "para", e.target.value)}
                    className="w-40 p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm"
                  >
                    {opcoesNodos.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                  <Input
                    aria-label={`Rótulo do fluxo ${f.id}`}
                    value={f.rotulo ?? ""}
                    onChange={(e) => atualizarFluxo(f.id, "rotulo", e.target.value)}
                    placeholder="Rótulo (ex.: SIM)"
                    className="w-40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600"
                    onClick={() => removerFluxo(f.id)}
                    aria-label={`Remover fluxo ${f.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={salvarSemantico} disabled={saving} className="gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar modelo
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={gerarBpmnDoModelo}>
              <Wand2 size={16} /> Gerar BPMN do modelo
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={gerarCanvasDoModelo}>
              <Wand2 size={16} /> Gerar canvas do modelo
            </Button>
          </div>
        </div>
      )}

      {aba === "MERMAID" && (
        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-sm text-slate-500">
            Edite o fluxo em Mermaid. Use <code>flowchart</code> ou <code>mindmap</code>. Ao salvar, o modelo semântico é
            reconstruído a partir do texto.
          </p>
          <Textarea
            aria-label="Texto Mermaid"
            value={mermaidMostrada}
            onChange={(e) => setMermaidOverride(e.target.value)}
            className="font-mono text-sm"
            rows={16}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={salvarMermaid} disabled={saving} className="gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar texto
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={importarMermaid}>
              <ArrowRight size={16} /> Importar texto → modelo
            </Button>
          </div>
        </div>
      )}

      {aba === "BPMN" && (
        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              Diagrama BPMN 2.0 editável (bpmn-js). Use o menu lateral para trocar tipos de nó.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={gerarBpmnDoModelo}>
                <Wand2 size={16} /> Gerar do modelo
              </Button>
              <Button type="button" onClick={salvarBpmn} disabled={saving} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar BPMN
              </Button>
            </div>
          </div>
          <BpmnEditor xml={bpmnXml} onChange={setBpmnXml} onWarning={(m) => toast.warning(m)} />
        </div>
      )}

      {aba === "CANVAS" && (
        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              Canvas livre (Excalidraw) — desenhe à mão livre. Ótimo para mapas mentais.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={gerarCanvasDoModelo}>
                <Wand2 size={16} /> Gerar do modelo
              </Button>
              <Button type="button" onClick={salvarCanvas} disabled={saving} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar canvas
              </Button>
            </div>
          </div>
          <CanvasExcalidrawEditor canvas={canvas} onChange={setCanvas} />
        </div>
      )}

      {aba === "EXPORTAR" && (
        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mermaid</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => copiar(mermaidAtual)}>
                  <Copy size={14} /> Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => baixar("diagrama.mmd", mermaidAtual)}
                >
                  <Download size={14} /> .mmd
                </Button>
              </div>
            </div>
            <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100" data-testid="export-mermaid">
              {mermaidAtual}
            </pre>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Resumo (markdown)</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => copiar(markdownAtual)}>
                  <Copy size={14} /> Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => baixar("resumo.md", markdownAtual)}
                >
                  <Download size={14} /> .md
                </Button>
              </div>
            </div>
            <pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs text-slate-100" data-testid="export-markdown">
              {markdownAtual}
            </pre>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modelo semântico (JSON)</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => copiar(jsonModelo)}>
                  <Copy size={14} /> Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => baixar("modelo.json", jsonModelo, "application/json")}
                >
                  <Download size={14} /> .json
                </Button>
              </div>
            </div>
            <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100" data-testid="export-json">
              {jsonModelo}
            </pre>
          </section>

          <p className="flex items-center gap-2 text-sm text-slate-500">
            <FileCode2 size={16} /> BPMN 2.0 editável pronto na aba BPMN (XML exportável pelo próprio editor).
          </p>
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Braces size={14} /> As representações são derivadas do modelo semântico sempre que possível — edite uma e reflita nas demais.
      </p>
    </div>
  )
}