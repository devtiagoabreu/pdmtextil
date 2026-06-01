"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ExternalLink } from "lucide-react"

type LinkItem = { url: string; descricao: string }

export function LinksEditor({
  links = [],
  onChange,
}: {
  links?: LinkItem[]
  onChange: (links: LinkItem[]) => void
}) {
  const [novaUrl, setNovaUrl] = useState("")
  const [novaDescricao, setNovaDescricao] = useState("")

  function add() {
    if (!novaUrl.trim()) return
    const novo: LinkItem = { url: novaUrl.trim(), descricao: novaDescricao.trim() }
    onChange([...links, novo])
    setNovaUrl("")
    setNovaDescricao("")
  }

  function remove(i: number) {
    onChange(links.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      <Label>Links</Label>
      {links.length > 0 && (
        <div className="space-y-1 mb-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-sm">
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline truncate">
                <ExternalLink size={12} />
                {link.descricao || link.url}
              </a>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(i)} aria-label={`Remover link ${i + 1}`}>
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">URL</Label>
          <Input size={8} value={novaUrl} onChange={e => setNovaUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Descrição</Label>
          <Input size={8} value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Foto, laudo..." />
        </div>
        <Button size="sm" onClick={add} disabled={!novaUrl.trim()} aria-label="Adicionar link">
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}
