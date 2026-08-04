"use client"

import { useEffect, useRef } from "react"

export function useEscapeClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])
}
