import { db } from "@/lib/db"
import { crmWhatsappFlowLogs } from "@/lib/db/schema/crm-whatsapp-flow-logs"

export interface EvolutionWebhookBody {
  data?: {
    key?: {
      remoteJid?: string
      fromMe?: boolean
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: { text?: string }
      imageMessage?: { caption?: string }
      documentMessage?: { caption?: string }
      videoMessage?: { caption?: string }
    }
    messageType?: string
  }
  sender?: string
  pushName?: string
  remoteJid?: string
}

export function extrairMensagem(body: EvolutionWebhookBody): string {
  const msg = body.data?.message
  if (!msg) return ""
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.videoMessage?.caption ||
    ""
  )
}

export function extrairNumero(remoteJid: string): string {
  return remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/@lid$/, "").replace(/\D/g, "")
}

export async function logStep(
  executionId: string,
  remoteJid: string,
  pushName: string,
  step: string,
  status: string,
  input: Record<string, any>,
  output: Record<string, any>,
  error: string | null,
  durationMs: number
) {
  try {
    await db.insert(crmWhatsappFlowLogs).values({
      executionId,
      remoteJid,
      pushName,
      step,
      status,
      input,
      output,
      error,
      durationMs,
    })
  } catch (e) {
    console.error("[FlowLog] Falha ao salvar log:", e)
  }
}
