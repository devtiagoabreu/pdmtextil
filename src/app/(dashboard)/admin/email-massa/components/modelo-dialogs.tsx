"use client"

import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { SanitizedHtml } from "@/components/ui/sanitized-html"
import { Copy } from "lucide-react"
import { modeloToHtml } from "@/lib/email-modelo"
import type { Modelo } from "../types"

export interface ModeloDialogsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editModelo: Modelo | null
  form: { nome: string; assunto: string; html: string }
  setForm: Dispatch<SetStateAction<{ nome: string; assunto: string; html: string }>>
  onSalvar: () => void
  viewModelo: Modelo | null
  onFecharVer: () => void
  onUsarModelo: (m: Modelo) => void
}

export function ModeloDialogs({
  open, onOpenChange, editModelo, form, setForm, onSalvar, viewModelo, onFecharVer, onUsarModelo,
}: ModeloDialogsProps) {
  return (
    <>
      {/* ─────── DIALOG MODELO ─────── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editModelo ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
            <DialogDescription>Preencha os dados do modelo de email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Modelo</Label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Boletim Informativo" />
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input value={form.assunto} onChange={e => setForm(p => ({ ...p, assunto: e.target.value }))} placeholder="Assunto do email" />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo HTML</Label>
              <Textarea value={form.html} onChange={e => setForm(p => ({ ...p, html: e.target.value }))}
                placeholder="Cole ou digite o HTML do email..."
                className="min-h-[200px] font-mono text-xs" />
              <p className="text-xs text-slate-400">Use <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">[NOME]</code> para personalizar com o nome do destinatário.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={onSalvar}>{editModelo ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG VER MODELO ─────── */}
      <Dialog open={!!viewModelo} onOpenChange={onFecharVer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewModelo?.nome}</DialogTitle>
            <DialogDescription>Assunto: {viewModelo?.assunto}</DialogDescription>
          </DialogHeader>
          {viewModelo && (
            <div className="border rounded-lg p-4 bg-white dark:bg-slate-800 overflow-y-auto max-h-96">
              <div className="text-xs text-slate-400 mb-2">Prévia do HTML:</div>
              <SanitizedHtml html={modeloToHtml(viewModelo.html)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onFecharVer}>Fechar</Button>
            <Button onClick={() => { if (viewModelo) { onUsarModelo(viewModelo); onFecharVer() } }} className="gap-1">
              <Copy size={14} /> Usar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ModeloDialogs
