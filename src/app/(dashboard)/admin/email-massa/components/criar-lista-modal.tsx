"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Disparo } from "../types"

export type TipoLista = "lidos" | "clicados" | "falhas"

const CONFIG: Record<TipoLista, { titulo: string; descricao: string; sugestao: (d: Disparo) => string }> = {
  lidos: {
    titulo: "Criar lista de contatos que leram o e-mail",
    descricao: "Serão incluídos os contatos deste envio que abriram o e-mail. A lista será salva com observação informando que são os contatos do envio original que foram lidos.",
    sugestao: (d) => `Lidos - ${d.nome || d.assunto}`,
  },
  clicados: {
    titulo: "Criar lista de contatos que clicaram",
    descricao: "Serão incluídos os contatos deste envio que clicaram em pelo menos um link. A lista será salva com observação informando que são os contatos do envio original que efetuaram cliques.",
    sugestao: (d) => `Cliques - ${d.nome || d.assunto}`,
  },
  falhas: {
    titulo: "Criar lista de contatos que falharam",
    descricao: "Serão incluídos os contatos deste envio cuja entrega falhou. A lista será salva com observação informando que são os contatos do envio original que falharam.",
    sugestao: (d) => `Falhas - ${d.nome || d.assunto}`,
  },
}

export function CriarListaModal({
  open,
  onOpenChange,
  tipo,
  disparo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: TipoLista
  disparo: Disparo | null
}) {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (open && disparo) setNome(CONFIG[tipo].sugestao(disparo))
  }, [open, tipo, disparo])

  if (!disparo) return null

  const cfg = CONFIG[tipo]

  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da lista")
      return
    }
    setSalvando(true)
    try {
      const res = await fetch(`/api/admin/email-massa/disparos/${disparo.id}/criar-lista`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, nome: nome.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar lista")
        return
      }
      toast.success(`Lista criada com ${data.total} contato(s)`)
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ["email-massa-listas"] })
    } catch {
      toast.error("Erro ao criar lista")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cfg.titulo}</DialogTitle>
          <DialogDescription>{cfg.descricao}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="nome-lista">Nome da lista</Label>
          <Input
            id="nome-lista"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Lidos - Promo Julho"
            disabled={salvando}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando} className="gap-1">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
            Criar lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
