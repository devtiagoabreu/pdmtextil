import { db } from "@/lib/db"
import { crmWhatsappBotLogs } from "@/lib/db/schema/crm-whatsapp-bot-logs"
import type { NewCrmWhatsappBotLog } from "@/lib/db/schema/crm-whatsapp-bot-logs"

export async function registrarLogBot(entrada: NewCrmWhatsappBotLog): Promise<void> {
  try {
    await db.insert(crmWhatsappBotLogs).values({
      tipo: entrada.tipo,
      origem: entrada.origem,
      status: entrada.status,
      detalhe: entrada.detalhe ?? {},
      erro: entrada.erro ?? null,
    })
  } catch (e) {
    console.error("[BOT-LOG] Falha ao registrar log:", e)
  }
}