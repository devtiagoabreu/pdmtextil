import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { emailListaContatos } from "@/lib/db/schema/email-listas"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { userEmailConfig } from "@/lib/db/schema/user-email-config"
import { eq, inArray } from "drizzle-orm"
import { sendEmail, sendEmailAsUser, parseEmails } from "@/lib/email"
import { decrypt } from "@/lib/crypto"
import crypto from "crypto"

export const dynamic = "force-dynamic"

interface Destinatario {
  email: string
  nome: string
}

async function buscarDestinatarios(para: string, listas?: number[]): Promise<Destinatario[]> {
  if (para === "clientes") {
    const lista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
    const result: Destinatario[] = []
    for (const c of lista) {
      const emails = parseEmails(c.email)
      for (const addr of emails) {
        result.push({ email: addr, nome: c.nome || "Cliente" })
      }
    }
    return result
  }

  if (para === "usuarios") {
    const lista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))
    return lista.filter(u => u.email && u.email.includes("@")).map(u => ({ email: u.email!, nome: u.name || "Usuário" }))
  }

  if (para === "todos") {
    const clientesLista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
    const usuariosLista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))

    const result: Destinatario[] = []
    for (const c of clientesLista) {
      const emails = parseEmails(c.email)
      for (const addr of emails) {
        result.push({ email: addr, nome: c.nome || "Cliente" })
      }
    }
    for (const u of usuariosLista) {
      if (u.email && u.email.includes("@")) {
        result.push({ email: u.email, nome: u.name || "Usuário" })
      }
    }
    return result
  }

  if (para === "lista" && listas && listas.length > 0) {
    return await db.select({ email: emailListaContatos.email, nome: emailListaContatos.nome })
      .from(emailListaContatos)
      .where(inArray(emailListaContatos.listaId, listas))
  }

  return []
}

function injectTrackingPixel(html: string, trackingId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/admin/email-massa/tracking/${trackingId}`
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`)
  }
  return html + pixel
}

function injectLinkTracking(html: string, trackingId: string, baseUrl: string): string {
  const clickBase = `${baseUrl}/api/admin/email-massa/click/${trackingId}`
  return html.replace(
    /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
    (_match, before, url, after) => {
      if (
        url.startsWith("mailto:") ||
        url.startsWith("javascript:") ||
        url.startsWith("#") ||
        url.startsWith(clickBase)
      ) {
        return _match
      }
      return `<a ${before}href="${clickBase}?url=${encodeURIComponent(url)}"${after}>`
    }
  )
}

function aplicarTracking(html: string, trackingId: string, baseUrl: string): string {
  let resultado = injectTrackingPixel(html, trackingId, baseUrl)
  resultado = injectLinkTracking(resultado, trackingId, baseUrl)
  return resultado
}

async function registrarEnvio(params: {
  listaId?: number
  remessaId?: string
  email: string
  nome?: string
  assunto: string
  status: string
  trackingId?: string
  error?: string
}) {
  try {
    await db.insert(emailEnviados).values({
      listaId: params.listaId,
      remessaId: params.remessaId || null,
      email: params.email,
      nome: params.nome || null,
      assunto: params.assunto,
      status: params.status,
      trackingId: params.trackingId || null,
      error: params.error || null,
    })
  } catch (err) {
    console.error("[EMAIL-MASSA] Erro ao registrar envio:", err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { para, assunto, html, listas, modo_envio, remetente } = body

    if (!para || !assunto || !html) {
      return NextResponse.json({ error: "Para, assunto e conteúdo são obrigatórios" }, { status: 400 })
    }

    if (para === "lista" && (!listas || listas.length === 0)) {
      return NextResponse.json({ error: "Selecione pelo menos uma lista" }, { status: 400 })
    }

    const destinatarios = await buscarDestinatarios(para, listas)
    if (destinatarios.length === 0) {
      return NextResponse.json({ error: "Nenhum destinatário encontrado" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const remessaId = crypto.randomUUID()
    let enviados = 0
    let total = 0
    const erros: string[] = []

    let userSmtpConfig: { email: string; senhaApp: string; host: string; port: number } | null = null
    if (remetente === "usuario") {
      const configs = await db.select()
        .from(userEmailConfig)
        .where(eq(userEmailConfig.usuarioId, Number(session.user.id)))
        .limit(1)
      if (configs.length > 0) {
        const cfg = configs[0]
        userSmtpConfig = {
          email: cfg.email,
          senhaApp: decrypt(cfg.senhaApp),
          host: cfg.host,
          port: cfg.port,
        }
      }
    }

    const enviarEmailFn = userSmtpConfig
      ? (params: { to: string | string[]; subject: string; html: string; bcc?: string | string[] }) =>
          sendEmailAsUser({ ...params, userConfig: userSmtpConfig! })
      : sendEmail

    if (modo_envio === "individual") {
      for (const d of destinatarios) {
        total++
        const trackingId = crypto.randomUUID()
        const personalizado = html.replace(/\[NOME\]/g, d.nome)
        const comTracking = aplicarTracking(personalizado, trackingId, baseUrl)
        const result = await enviarEmailFn({ to: d.email, subject: assunto, html: comTracking })
        if (result.sent > 0) {
          enviados++
          await registrarEnvio({
            email: d.email,
            nome: d.nome,
            assunto,
            status: "enviado",
            trackingId,
            remessaId,
            listaId: para === "lista" ? listas?.[0] : undefined,
          })
        } else {
          await registrarEnvio({
            email: d.email,
            nome: d.nome,
            assunto,
            status: "falhou",
            error: result.error || undefined,
            remessaId,
            listaId: para === "lista" ? listas?.[0] : undefined,
          })
          erros.push(`${d.email}: ${result.error}`)
        }
      }
    } else {
      const personalizado = html.replace(/\[NOME\]/g, "Cliente")
      total = destinatarios.length

      if (modo_envio === "bcc") {
        const firstTrackingId = crypto.randomUUID()
        const comTracking = aplicarTracking(personalizado, firstTrackingId, baseUrl)
        const result = await enviarEmailFn({
          to: destinatarios[0].email,
          subject: assunto,
          html: comTracking,
          bcc: destinatarios.slice(1).map(d => d.email),
        })
        if (result.sent > 0) {
          enviados = destinatarios.length
          await registrarEnvio({
            email: destinatarios[0].email,
            nome: destinatarios[0].nome,
            assunto,
            status: "enviado",
            trackingId: firstTrackingId,
            remessaId,
          })
          for (let i = 1; i < destinatarios.length; i++) {
            await registrarEnvio({
              email: destinatarios[i].email,
              nome: destinatarios[i].nome,
              assunto,
              status: "enviado",
              remessaId,
            })
          }
        } else {
          for (const d of destinatarios) {
            await registrarEnvio({
              email: d.email,
              nome: d.nome,
              assunto,
              status: "falhou",
              error: result.error || undefined,
              remessaId,
            })
          }
          erros.push(result.error || "Erro no envio BCC")
        }
      } else {
        for (const d of destinatarios) {
          const trackingId = crypto.randomUUID()
          const comTracking = aplicarTracking(personalizado, trackingId, baseUrl)
          const result = await enviarEmailFn({ to: d.email, subject: assunto, html: comTracking })
          if (result.sent > 0) {
            enviados++
            await registrarEnvio({
              email: d.email,
              nome: d.nome,
              assunto,
              status: "enviado",
              trackingId,
              remessaId,
            })
          } else {
            await registrarEnvio({
              email: d.email,
              nome: d.nome,
              assunto,
              status: "falhou",
              error: result.error || undefined,
              remessaId,
            })
            erros.push(`${d.email}: ${result.error}`)
          }
        }
      }
    }

    return NextResponse.json({ success: enviados > 0, total, enviados, erros: erros.slice(0, 10) })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa]", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar emails" }, { status: 500 })
  }
}
