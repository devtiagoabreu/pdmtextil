"use client"

import { Label } from "@/components/ui/label"
import { InfoButton } from "@/components/ui/info-button"
import type { InfoContent } from "@/lib/info-content"

interface CampoInfoProps {
  titulo: string
  sobre: InfoContent
  htmlFor?: string
  obrigatorio?: boolean
}

export function CampoInfo({ titulo, sobre, htmlFor, obrigatorio = false }: CampoInfoProps) {
  return (
    <div className="flex items-center">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {titulo}
        {obrigatorio ? " *" : ""}
      </Label>
      <InfoButton content={sobre} />
    </div>
  )
}
