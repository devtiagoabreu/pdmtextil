import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailAgendados } from "@/lib/db/schema/email-agendados"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { eq, and, lte, isNull } from "drizzle-orm"
import { sendEmail, sendEmailAsUser, parseEmails } from "@/lib/email"
import { decrypt } from "@/lib/crypto"
import { emailListaContatos } from "@/lib/db/schema/email-listas"
import { userEmailConfig } from "@/lib/db/schema/user-email-config"
import { inArray } from "drizzle-orm"
import crypto from "crypto"

export const dynamic = "force-dynamic"

interface Destinatario { email: string; nome: string }

async function buscarDestinatarios(para: string, listas?: number[]): Promise<Destinatario[]> {
  if (para === "lista" && listas && listas.length > 0) {
    const contatos = await db.select({ email: emailListaContatos.email, nome: emailListaContatos.nome })
      .from(emailListaContatos)
      .where(inArray(emailListaContatos.listaId, listas))
    const result: Destinatario[] = []
    for (const c of contatos) {
      const emails = parseEmails(c.email)
      for (const addr of emails) result.push({ email: addr, nome: c.nome || "Contato" })
    }
    return result
  }
  return []
}

function aplicarTracking(html: string, trackingId: string, baseUrl: string): string {
  let resultado = html.replace("</body>", `<img src="${baseUrl}/api/admin/email-massa/tracking/${trackingId}" width="1" height="1" alt="" style="display:none;" /></body>`)
  const clickBase = `${baseUrl}/api/admin/email-massa/click/${trackingId}`
  resultado = resultado.replace(/<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
    (_match, before, url, after) => {
      if (url.startsWith("mailto:") || url.startsWith("javascript:") || url.startsWith("#") || url.startsWith(clickBase)) return _match
      return `<a ${before}href="${clickBase}?url=${encodeURIComponent(url)}"${after}>`
    })
  return resultado
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const now = new Date()
    const pendentes = await db.select().from(emailAgendados)
      .where(and(eq(emailAgendados.status, "agendado"), lte(emailAgendados.agendadoPara, now)))

    if (pendentes.length === 0) {
      return NextResponse.json({ executados: 0, message: "Nenhum agendamento pendente" })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pdmprotextil.vercel.app"
    let executados = 0
    const erros: string[] = []

    for (const agendado of pendentes) {
      try {
        const destinatarios = await buscarDestinatarios(agendado.para, agendado.listas as number[] || undefined)
        if (destinatarios.length === 0) {
          await db.update(emailAgendados).set({ status: "erro", erro: "Nenhum destinatário encontrado", enviadoEm: now }).where(eq(emailAgendados.id, agendado.id))
          continue
        }

        let userSmtpConfig: { email: string; senhaApp: string; host: string; port: number } | null = null
        if (agendado.remetente === "usuario" && agendado.criadoPor) {
          const configs = await db.select().from(userEmailConfig).where(eq(userEmailConfig.usuarioId, agendado.criadoPor)).limit(1)
          if (configs.length > 0) {
            const cfg = configs[0]
            userSmtpConfig = { email: cfg.email, senhaApp: decrypt(cfg.senhaApp), host: cfg.host, port: cfg.port }
          }
        }

        const enviarEmailFn = userSmtpConfig
          ? (params: { to: string | string[]; subject: string; html: string; bcc?: string | string[] }) =>
              sendEmailAsUser({ ...params, userConfig: userSmtpConfig! })
          : sendEmail

        const remessaId = crypto.randomUUID()
        let enviados = 0

        if (agendado.modoEnvio === "bcc") {
          const trackingId = crypto.randomUUID()
          const comTracking = aplicarTracking(agendado.html, trackingId, baseUrl)
          const result = await enviarEmailFn({ to: destinatarios[0].email, subject: agendado.assunto, html: comTracking, bcc: destinatarios.slice(1).map(d => d.email) })
          if (result.sent > 0) {
            enviados = destinatarios.length
            await db.insert(emailEnviados).values({ remessaId, email: destinatarios[0].email, nome: destinatarios[0].nome, assunto: agendado.assunto, status: "enviado", trackingId })
            for (let i = 1; i < destinatarios.length; i++) {
              await db.insert(emailEnviados).values({ remessaId, email: destinatarios[i].email, nome: destinatarios[i].nome, assunto: agendado.assunto, status: "enviado" })
            }
          }
        } else {
          for (const d of destinatarios) {
            const trackingId = crypto.randomUUID()
            const personalizado = agendado.html.replace(/\[NOME\]/g, agendado.modoEnvio === "individual" ? d.nome : "Cliente")
            const comTracking = aplicarTracking(personalizado, trackingId, baseUrl)
            const result = await enviarEmailFn({ to: d.email, subject: agendado.assunto, html: comTracking })
            await db.insert(emailEnviados).values({ remessaId, email: d.email, nome: d.nome, assunto: agendado.assunto, status: result.sent > 0 ? "enviado" : "falhou", trackingId, error: result.sent > 0 ? undefined : result.error })
            if (result.sent > 0) enviados++
          }
        }

        await db.update(emailAgendados).set({ status: "enviado", enviadoEm: now, erro: null }).where(eq(emailAgendados.id, agendado.id))
        executados++
      } catch (err: any) {
        await db.update(emailAgendados).set({ status: "erro", erro: err.message || "Erro desconhecido", enviadoEm: now }).where(eq(emailAgendados.id, agendado.id))
        erros.push(`#${agendado.id}: ${err.message}`)
      }
    }

    return NextResponse.json({ executados, erros: erros.slice(0, 10) })
  } catch (error) {
    console.error("[POST /api/admin/email-massa/agendados/executar]", error)
    return NextResponse.json({ error: "Erro ao executar agendamentos" }, { status: 500 })
  }
}
