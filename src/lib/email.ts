import nodemailer from "nodemailer"
import { db } from "./db"
import { emailConfig } from "./db/schema/email-config"
import { crmEmailConfig } from "./db/schema/crm-email-config"
import { eq } from "drizzle-orm"
import { decrypt } from "./crypto"

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
    auth: { user: cfg.user, pass: decrypt(cfg.pass) },
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
  bcc?: string | string[]
}) {
  const configs = await db.select().from(emailConfig).where(eq(emailConfig.ativo, true)).limit(1)
  if (configs.length === 0) return { sent: 0, error: "Sem config de email" }

  const cfg = configs[0]
  return enviarComTransporte({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    pass: decrypt(cfg.pass),
    fromName: cfg.fromName || "PDM Têxtil",
  }, params)
}

export async function sendEmailAsUser(params: {
  to: string | string[]
  subject: string
  html: string
  bcc?: string | string[]
  userConfig: {
    email: string
    senhaApp: string
    host: string
    port: number
  }
}) {
  const { userConfig, ...emailParams } = params
  return enviarComTransporte({
    host: userConfig.host,
    port: userConfig.port,
    user: userConfig.email,
    pass: userConfig.senhaApp,
    fromName: userConfig.email.split("@")[0],
  }, emailParams)
}

export async function sendCrmEmail(params: {
  to: string | string[]
  subject: string
  html: string
  bcc?: string | string[]
}) {
  const configs = await db.select().from(crmEmailConfig).where(eq(crmEmailConfig.ativo, true)).limit(1)
  if (configs.length === 0) {
    return await sendEmail(params)
  }

  const cfg = configs[0]
  return enviarComTransporte({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    pass: decrypt(cfg.pass),
    fromName: cfg.fromName || "PDM PRO TEXTIL - CRM",
  }, params)
}

interface TransportConfig {
  host: string
  port: number
  user: string
  pass: string
  fromName: string
}

async function enviarComTransporte(tc: TransportConfig, params: {
  to: string | string[]
  subject: string
  html: string
  bcc?: string | string[]
}) {
  const t = nodemailer.createTransport({
    host: tc.host,
    port: tc.port,
    secure: tc.port === 465,
    auth: { user: tc.user, pass: tc.pass },
  })

  const toList = Array.isArray(params.to) ? params.to : [params.to]
  if (toList.length === 0) return { sent: 0, error: "Nenhum destinatário" }

  const bccList = params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]) : undefined

  try {
    await t.sendMail({
      from: `"${tc.fromName}" <${tc.user}>`,
      to: toList.join(", "),
      bcc: bccList?.join(", "),
      subject: params.subject,
      html: params.html,
    })
    t.close()
    return { sent: toList.length, error: null }
  } catch (err: any) {
    t.close()
    console.error("[EMAIL] Erro no envio:", err.message)
    return { sent: 0, error: err.message || "Erro ao enviar email" }
  }
}
