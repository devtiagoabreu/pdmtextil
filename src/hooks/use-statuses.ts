"use client"

import { useState, useEffect } from "react"

export type StatusConfig = {
  id: number
  nome: string
  rotulo: string | null
  tipo: string
  cor: string | null
  ordem: number | null
  ativo: boolean | null
}

const cache = new Map<string, StatusConfig[]>()

export function useStatuses(tipo: string) {
  const [statuses, setStatuses] = useState<StatusConfig[]>(cache.get(tipo) || [])
  const [loading, setLoading] = useState(!cache.has(tipo))

  useEffect(() => {
    if (cache.has(tipo)) {
      setStatuses(cache.get(tipo)!)
      setLoading(false)
      return
    }

    fetch(`/api/admin/status?tipo=${encodeURIComponent(tipo)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          cache.set(tipo, data)
          setStatuses(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tipo])

  const getStatus = (nome: string): StatusConfig | undefined =>
    statuses.find((s) => s.nome === nome)

  const getLabel = (nome: string): string =>
    getStatus(nome)?.rotulo || nome

  const getColor = (nome: string): string =>
    getStatus(nome)?.cor || "#94a3b8"

  return { statuses, loading, getStatus, getLabel, getColor }
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
