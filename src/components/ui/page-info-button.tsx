"use client"

import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

export function PageInfoButton() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  if (!info) return null
  return <InfoButton content={info} />
}
