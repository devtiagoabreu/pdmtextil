"use client"

import type { RefObject, Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Send, Loader2, FileText, Eye, Clock, X,
} from "lucide-react"
import { EditorEmail, type EditorEmailHandle } from "./editor-email"
import { EnvioProgresso } from "./envio-progresso"
import type { Lista, Modelo, Agendado, Disparo } from "../types"

export interface EnviarTabProps {
  editorRef: RefObject<EditorEmailHandle | null>
  assunto: string
  setAssunto: Dispatch<SetStateAction<string>>
  preheader: string
  setPreheader: Dispatch<SetStateAction<string>>
  para: string
  setPara: Dispatch<SetStateAction<string>>
  modoEnvio: string
  setModoEnvio: Dispatch<SetStateAction<string>>
  remetente: string
  setRemetente: Dispatch<SetStateAction<string>>
  userEmailConfig: { email: string } | null
  listas: Lista[]
  selectedListaIds: number[]
  toggleListaSelecionada: (id: number) => void
  agendadoForm: { nome: string; agendadoPara: string }
  setAgendadoForm: Dispatch<SetStateAction<{ nome: string; agendadoPara: string }>>
  editAgendado: Agendado | null
  onLimparEdicao: () => void
  modelos: Modelo[]
  onUsarModelo: (m: Modelo) => void
  onSalvarComoModelo: () => void
  onSalvarAgendado: (status: "rascunho" | "agendado") => void
  sending: boolean
  onEnviar: () => void
  disparoProgresso?: Disparo | null
}

export function EnviarTab(props: EnviarTabProps) {
  const {
    editorRef, assunto, setAssunto, preheader, setPreheader, para, setPara,
    modoEnvio, setModoEnvio, remetente, setRemetente, userEmailConfig,
    listas, selectedListaIds, toggleListaSelecionada,
    agendadoForm, setAgendadoForm, editAgendado, onLimparEdicao,
    modelos, onUsarModelo, onSalvarComoModelo, onSalvarAgendado, sending, onEnviar,
    disparoProgresso,
  } = props

  const progresso = disparoProgresso

  return (
    <div className="w-full rounded-xl border bg-card text-card-foreground shadow flex flex-col">
      <div className="p-6 flex flex-col space-y-8">

        <EnvioProgresso progresso={progresso ?? null} />

        {/* ── Configurações de Envio ── */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Configurações de Envio</h2>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="para">Enviar para</Label>
            <select id="para" value={para} onChange={e => setPara(e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
              <option value="todos">Clientes + Usuários do Sistema</option>
              <option value="clientes">Apenas Clientes</option>
              <option value="usuarios">Apenas Usuários do Sistema</option>
              <option value="lista">Lista de Destinatários</option>
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input id="assunto" value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email" />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="preheader">Texto de Preview (opcional)</Label>
            <Input id="preheader" value={preheader} onChange={e => setPreheader(e.target.value)} placeholder="Texto que aparece após o assunto na caixa de entrada" maxLength={150} />
            <p className="text-xs text-slate-500">Texto curto que aparece após o assunto no cliente de email. Máx. 150 caracteres.</p>
          </div>

          {para === "lista" && (
            <div className="flex flex-col space-y-2">
              <Label>Selecionar Listas</Label>
              <div className="border rounded-lg border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto p-2 space-y-1">
                {listas.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">Nenhuma lista cadastrada. Vá na aba Listas para criar.</p>
                ) : listas.map((l: any) => (
                  <label key={l.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-6">
                    <input type="checkbox" checked={selectedListaIds.includes(l.id)}
                      onChange={() => toggleListaSelecionada(l.id)}
                      className="rounded border-slate-300" />
                    <span className="text-sm font-medium">{l.nome}</span>
                    <span className="text-xs text-slate-500">({l.totalContatos} contatos)</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <fieldset className="flex flex-col space-y-2 min-w-0">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Remetente</legend>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer min-h-6">
                <input type="radio" name="remetente" value="sistema" checked={remetente === "sistema"}
                  onChange={e => setRemetente(e.target.value)} className="text-blue-600" />
                <span className="text-sm">Sistema (<code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">SMTP padrão</code>)</span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer min-h-6 ${!userEmailConfig ? "opacity-50" : ""}`}>
                <input type="radio" name="remetente" value="usuario" checked={remetente === "usuario"}
                  onChange={e => setRemetente(e.target.value)} className="text-blue-600"
                  disabled={!userEmailConfig} />
                <span className="text-sm">
                  {userEmailConfig ? `Meu Email (${userEmailConfig.email})` : "Meu Email"}
                </span>
              </label>
            </div>
            {!userEmailConfig && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Nenhuma configuração encontrada. Vá em Meu Perfil.
              </p>
            )}
          </fieldset>

          <fieldset className="flex flex-col space-y-2 min-w-0">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Modo de Envio</legend>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer min-h-6">
                <input type="radio" name="modo_envio" value="bcc" checked={modoEnvio === "bcc"}
                  onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                <span className="text-sm">Cópia Oculta (BCC)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer min-h-6">
                <input type="radio" name="modo_envio" value="to" checked={modoEnvio === "to"}
                  onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                <span className="text-sm">Para (TO)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer min-h-6">
                <input type="radio" name="modo_envio" value="individual" checked={modoEnvio === "individual"}
                  onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                <span className="text-sm">Individual (<code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">[NOME]</code>)</span>
              </label>
            </div>
          </fieldset>
        </section>

        <Separator />

        {/* ── Programação (quando aplicável) ── */}
        <section className="flex flex-col space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" /> Programação
            <span className="text-xs font-normal text-slate-500">(opcional — para salvar rascunho ou agendar)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="nome-disparo" className="text-xs">Nome do Disparo</Label>
              <Input id="nome-disparo" value={agendadoForm.nome} onChange={e => setAgendadoForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Promoção de Verão" />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="agendar-para" className="text-xs">Agendar para (data/hora)</Label>
              <Input id="agendar-para" type="datetime-local" value={agendadoForm.agendadoPara} onChange={e => setAgendadoForm(f => ({ ...f, agendadoPara: e.target.value }))} />
            </div>
          </div>
        </section>

        <Separator />
        <section className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Conteúdo do Email</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onSalvarComoModelo} className="gap-1">
                <FileText size={14} /> Salvar como Modelo
              </Button>
              <Button variant="outline" size="sm" onClick={() => editorRef.current?.openPreview()} className="gap-1">
                <Eye size={14} /> Preview
              </Button>
            </div>
          </div>

          <EditorEmail ref={editorRef} assunto={assunto} />
        </section>

        {/* ── Botão Enviar ── */}
        {editAgendado && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Clock size={16} className="text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Editando: <strong>{editAgendado.nome || editAgendado.assunto}</strong>
              {editAgendado.status === "rascunho" ? " (Rascunho)" : ""}
            </span>
            <Button variant="ghost" size="xs" onClick={onLimparEdicao} className="ml-auto gap-1">
              <X size={12} /> Limpar
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          {modelos.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap max-w-md">
              <span className="text-xs text-slate-400 mr-1">Modelos:</span>
              {modelos.slice(0, 3).map((m: any) => (
                <button key={m.id} type="button" onClick={() => onUsarModelo(m)}
                  className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800">
                  {m.nome}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onSalvarAgendado("rascunho")} className="gap-2">
              <FileText size={16} /> Salvar Rascunho
            </Button>
            <Button variant="outline" onClick={() => {
              if (!agendadoForm.agendadoPara) {
                toast.info("Preencha a data/hora na seção Programação acima")
                return
              }
              onSalvarAgendado("agendado")
            }} className="gap-2">
              <Clock size={16} /> Agendar
            </Button>
            <Button onClick={onEnviar} disabled={sending} className="gap-2">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Enviando..." : "Enviar Email em Massa"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EnviarTab
