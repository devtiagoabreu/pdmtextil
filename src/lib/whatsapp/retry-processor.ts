import { db } from "@/lib/db"
import { crmWhatsappRetryQueue } from "@/lib/db/schema/crm-whatsapp-retry-queue"
import { eq, and, lte } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"

export async function processarRetryQueue(): Promise<{ processados: number; sucessos: number; falhas: number }> {
  if (!evolutionConfigurado()) return { processados: 0, sucessos: 0, falhas: 0 }

  const pendentes = await db
    .select()
    .from(crmWhatsappRetryQueue)
    .where(
      and(
        eq(crmWhatsappRetryQueue.status, "PENDENTE"),
        lte(crmWhatsappRetryQueue.proximoRetryAt, new Date())
      )
    )
    .limit(20)

  let sucessos = 0
  let falhas = 0

  for (const item of pendentes) {
    const resultado = await enviarMensagem(item.remoteJid, item.mensagem)

    if (resultado.sucesso) {
      await db.update(crmWhatsappRetryQueue)
        .set({ status: "ENVIADO" })
        .where(eq(crmWhatsappRetryQueue.id, item.id))
      sucessos++
    } else {
      const novasTentativas = item.tentativas + 1
      const nextStatus = novasTentativas >= item.maxTentativas ? "FALHOU" : "PENDENTE"
      const proximoRetry = nextStatus === "PENDENTE"
        ? new Date(Date.now() + Math.pow(2, novasTentativas) * 60 * 1000) // exponential backoff: 2min, 4min, 8min
        : null

      await db.update(crmWhatsappRetryQueue)
        .set({
          tentativas: novasTentativas,
          status: nextStatus,
          ultimoErro: resultado.erro || "Unknown error",
          proximoRetryAt: proximoRetry,
        })
        .where(eq(crmWhatsappRetryQueue.id, item.id))
      falhas++
    }
  }

  return { processados: pendentes.length, sucessos, falhas }
}

export async function enfileirarRetry(remoteJid: string, mensagem: string, erro: string): Promise<void> {
  await db.insert(crmWhatsappRetryQueue).values({
    remoteJid,
    mensagem,
    tentativas: 0,
    maxTentativas: 3,
    status: "PENDENTE",
    ultimoErro: erro,
    proximoRetryAt: new Date(Date.now() + 2 * 60 * 1000), // first retry in 2 minutes
  })
}
