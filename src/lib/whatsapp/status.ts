import { db } from "@/lib/db"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { and, eq, desc, sql } from "drizzle-orm"

function parseBody(rawText: string): any {
  try {
    return JSON.parse(rawText)
  } catch {
    try {
      return JSON.parse(Buffer.from(rawText, "base64").toString("utf-8"))
    } catch {
      return null
    }
  }
}

export interface StatusUpdateInfo {
  event: string
  externalId?: string
  remoteJid?: string
  status: string
}

export function extrairStatusUpdate(rawText: string): StatusUpdateInfo | null {
  const body = parseBody(rawText)
  if (!body) return null
  const evento = body.event || body.type || ""
  const ehUpdate = /messages\.update/i.test(evento) || /MESSAGES_UPDATE/i.test(evento)
  if (!ehUpdate) return null
  const data = body.data || {}
  if (!data.key || typeof data.status !== "string" || data.status.length === 0) return null
  return {
    event: evento,
    externalId: data.key.id,
    remoteJid: data.key.remoteJid || body.sender || "",
    status: data.status.toUpperCase(),
  }
}

export function mapearStatusEvolution(evo: string): string | null {
  const mapa: Record<string, string> = {
    PENDING: "ENVIADA",
    SERVER_ACK: "ENVIADA",
    SENT: "ENVIADA",
    RECEIVED: "ENTREGUE",
    DELIVERY_ACK: "ENTREGUE",
    READ: "LIDA",
    PLAYED: "LIDA",
    FAILED: "ERRO",
  }
  return mapa[evo] || null
}

export const RANK_STATUS: Record<string, number> = {
  ENVIADA: 1,
  ENTREGUE: 2,
  LIDA: 3,
  ERRO: 4,
}

export async function processarStatusUpdate(rawText: string): Promise<{ tratado: boolean; status?: string; mensagemId?: number; downgradeBloqueado?: boolean }> {
  const info = extrairStatusUpdate(rawText)
  if (!info) return { tratado: false }

  const status = mapearStatusEvolution(info.status)
  if (!status) return { tratado: true }

  const conditions = []
  if (info.externalId) {
    conditions.push(eq(crmWhatsappMensagens.externalId, info.externalId))
  }
  if (info.remoteJid) {
    conditions.push(eq(crmWhatsappMensagens.remoteJid, info.remoteJid))
  }
  if (conditions.length === 0) return { tratado: true }

  const alvo = await db
    .select({ id: crmWhatsappMensagens.id, status: crmWhatsappMensagens.status })
    .from(crmWhatsappMensagens)
    .where(and(...conditions))
    .orderBy(desc(crmWhatsappMensagens.id))
    .limit(1)
    .then((r: any) => r[0] || null)

  if (!alvo) return { tratado: true }

  const rankAtual = RANK_STATUS[alvo.status] ?? 0
  const rankNovo = RANK_STATUS[status] ?? 0
  if (rankNovo < rankAtual) return { tratado: true, status: alvo.status, mensagemId: alvo.id, downgradeBloqueado: true }

  await db.update(crmWhatsappMensagens).set({ status }).where(eq(crmWhatsappMensagens.id, alvo.id))
  return { tratado: true, status, mensagemId: alvo.id }
}

export async function registrarExternalIdEnviada(remoteJid: string, externalId?: string | null): Promise<void> {
  if (!remoteJid || !externalId) return

  const alvo = await db
    .select({ id: crmWhatsappMensagens.id })
    .from(crmWhatsappMensagens)
    .where(and(eq(crmWhatsappMensagens.remoteJid, remoteJid), eq(crmWhatsappMensagens.tipo, "ENVIADA"), sql`${crmWhatsappMensagens.externalId} IS NULL`))
    .orderBy(desc(crmWhatsappMensagens.id))
    .limit(1)
    .then((r: any) => r[0] || null)

  if (alvo) {
    await db.update(crmWhatsappMensagens).set({ externalId }).where(eq(crmWhatsappMensagens.id, alvo.id))
  }
}