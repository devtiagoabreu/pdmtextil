import { db } from "./db"
import { status } from "./db/schema"
import { eq, asc } from "drizzle-orm"

export type StatusConfig = {
  id: number
  nome: string
  rotulo: string | null
  tipo: string
  cor: string | null
  ordem: number | null
  ativo: boolean | null
}

export async function getStatusesByTipo(tipo: string): Promise<StatusConfig[]> {
  const rows = await db
    .select()
    .from(status)
    .where(eq(status.tipo, tipo))
    .orderBy(asc(status.ordem), asc(status.nome))
  return rows
}

export async function getStatusMap(tipo: string): Promise<Map<string, StatusConfig>> {
  const rows = await getStatusesByTipo(tipo)
  const map = new Map<string, StatusConfig>()
  for (const row of rows) {
    map.set(row.nome, row)
  }
  return map
}

export async function getValidStatuses(tipo: string): Promise<string[]> {
  const rows = await getStatusesByTipo(tipo)
  return rows.map((r) => r.nome)
}
