import nodemailer from "nodemailer"
import { db } from "./db"
import { emailConfig } from "./db/schema/email-config"
import { eq } from "drizzle-orm"

let transporter: nodemailer.Transporter | null = null

export async function getTransporter() {
  if (transporter) return transporter

  const configs = await db.select().from(emailConfig).where(eq(emailConfig.ativo, true)).limit(1)
  if (configs.length === 0) {
    throw new Error("Nenhuma configuração de email ativa encontrada. Configure o SMTP em Admin > Configurações.")
  }

  const cfg = configs[0]
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  })

  return transporter
}

export function clearTransporter() {
  transporter = null
}

export function parseEmails(emailField: string | null | undefined): string[] {
  if (!emailField || !emailField.trim()) return []
  return emailField
    .split(/[,;\n]/)
    .map(e => e.trim())
    .filter(e => e.includes("@"))
}

export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
}) {
  const configs = await db.select().from(emailConfig).where(eq(emailConfig.ativo, true)).limit(1)
  if (configs.length === 0) return { sent: 0, error: "Sem config de email" }

  const cfg = configs[0]
  const t = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  })

  const toList = Array.isArray(params.to) ? params.to : [params.to]
  let sent = 0
  let lastError: string | null = null

  for (const addr of toList) {
    try {
      await t.sendMail({
        from: `"${cfg.fromName || "PDM Têxtil"}" <${cfg.user}>`,
        to: addr,
        subject: params.subject,
        html: params.html,
      })
      sent++
    } catch (err: any) {
      lastError = err.message || "Erro ao enviar email"
      console.error(`[EMAIL] Falha ao enviar para ${addr}:`, err.message)
    }
  }

  t.close()
  return { sent, error: lastError }
}
