"use client"

import { useEffect, useState } from "react"

export function SanitizedHtml({ html, className }: { html: string; className?: string }) {
  const [safeHtml, setSafeHtml] = useState("")

  useEffect(() => {
    let cancelled = false
    import("@/lib/sanitize").then(({ sanitizeHtml }) => {
      if (!cancelled) setSafeHtml(sanitizeHtml(html))
    })
    return () => {
      cancelled = true
    }
  }, [html])

  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />
}
