import { db } from "@/lib/db"
import { crmWhatsappConversas } from "@/lib/db/schema/crm-whatsapp-conversas"
import { crmNotificacoes } from "@/lib/db/schema/crm-notificacoes"
import { and, sql, eq } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"

const REPRESENTANTE_PF = process.env.WHATSAPP_REPRESENTANTE_PF || "5519999999998"
const ABANDONMENT_THRESHOLD_MINUTES = 15

export async function verificarAbandonos(): Promise<{ notificados: number }> {
  const threshold = new Date(Date.now() - ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000)

  const abandonadas = await db
    .select({
      remoteJid: crmWhatsappConversas.remoteJid,
      estado: crmWhatsappConversas.estado,
      dados: crmWhatsappConversas.dados,
      updatedAt: crmWhatsappConversas.updatedAt,
    })
    .from(crmWhatsappConversas)
    .where(
      and(
        sql`${crmWhatsappConversas.updatedAt} < ${threshold.toISOString()}::timestamp`,
        sql`${crmWhatsappConversas.estado} NOT IN ('SAUDACAO', 'ENCERRADO', 'HUMANO_ASSUMINDO', 'AGUARDANDO_REPRESENTANTE')`
      )
    )

  let notificados = 0

  for (const conv of abandonadas) {
    const jaNotificado = await db
      .select({ id: crmNotificacoes.id })
      .from(crmNotificacoes)
      .where(
        and(
          eq(crmNotificacoes.tipo, "WHATSAPP_ABANDONO"),
          sql`${crmNotificacoes.metadados}->>'remoteJid' = ${conv.remoteJid}`
        )
      )
      .limit(1)

    if (jaNotificado.length > 0) continue

    const nome = conv.dados?.nome || "Cliente"
    const numero = conv.remoteJid?.replace(/@s\.whatsapp\.net$/, "") || ""

    const notificacaoMsg = [
      "*Cliente abandonou o atendimento*",
      "",
      `Nome: ${nome}`,
      `WhatsApp: https://wa.me/${numero}`,
      `Estado: ${conv.estado}`,
      `Ultima interacao: ${conv.updatedAt ? new Date(conv.updatedAt).toLocaleString("pt-BR") : "desconhecido"}`,
      "",
      "O cliente nao respondeu nos ultimos 15 minutos.",
    ].join("\n")

    await db.insert(crmNotificacoes).values({
      titulo: "Cliente abandonou atendimento",
      mensagem: notificacaoMsg,
      tipo: "WHATSAPP_ABANDONO",
      link: "/admin/whatsapp-chat",
      metadados: { remoteJid: conv.remoteJid, estado: conv.estado, nome },
      lida: false,
    })

    if (evolutionConfigurado()) {
      await enviarMensagem(`${REPRESENTANTE_PF}@s.whatsapp.net`, notificacaoMsg)
    }

    notificados++
  }

  return { notificados }
}
