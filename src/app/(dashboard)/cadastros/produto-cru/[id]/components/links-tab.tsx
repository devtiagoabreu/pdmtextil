"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { LinksEditor } from "@/components/links/LinksEditor"
import type { LinkItem } from "./types"

interface Props {
  links: LinkItem[]
  onChangeLinks: (links: LinkItem[]) => void
  saving: boolean
  isEditing: boolean
}

export function LinksTab({ links, onChangeLinks, saving, isEditing }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <LinksEditor
          links={links}
          onChange={onChangeLinks}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEditing ? "Atualizar" : "Salvar"}
        </Button>
        <Link href="/cadastros/produto-cru">
          <Button variant="outline" type="button">Cancelar</Button>
        </Link>
      </div>
    </div>
  )
}
