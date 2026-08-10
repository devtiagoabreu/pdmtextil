import { db } from "./db"
import { clientes } from "./db/schema/clientes"
import { usuarios } from "./db/schema/usuarios"
import { emailListaContatos } from "./db/schema/email-listas"
import { emailDisparos } from "./db/schema/email-disparos"
import { emailEnviados } from "./db/schema/email-enviados"
import { emailOptouts } from "./db/schema/email-optouts"
import { eq, inArray } from "drizzle-orm"
import crypto from "crypto"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface Destinatario {
  email: string
  nome: string
}

async function aplicarOptouts(destinatarios: Destinatario[]): Promise<Destinatario[]> {
  if (destinatarios.length === 0) return destinatarios
  const optouts = await db.select({ email: emailOptouts.email }).from(emailOptouts)
  if (optouts.length === 0) return destinatarios
  const set = new Set(optouts.map((o: { email: string }) => o.email.toLowerCase()))
  return destinatarios.filter((d) => !set.has(d.email.toLowerCase()))
}

export async function buscarDestinatarios(para: string, listas?: number[]): Promise<Destinatario[]> {
  if (para === "clientes") {
    const lista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
    const result: Destinatario[] = []
    for (const c of lista) {
      for (const addr of parseEmails(c.email)) {
        result.push({ email: addr, nome: c.nome || "Cliente" })
      }
    }
    return aplicarOptouts(result)
  }

  if (para === "usuarios") {
    const lista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))
    return aplicarOptouts(
      lista
        .filter((u: any) => u.email && u.email.includes("@"))
        .map((u: any) => ({ email: u.email!, nome: u.name || "Usuário" })),
    )
  }

  if (para === "todos") {
    const clientesLista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
    const usuariosLista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))

    const result: Destinatario[] = []
    for (const c of clientesLista) {
      for (const addr of parseEmails(c.email)) {
        result.push({ email: addr, nome: c.nome || "Cliente" })
      }
    }
    for (const u of usuariosLista) {
      if (u.email && u.email.includes("@")) {
        result.push({ email: u.email, nome: u.name || "Usuário" })
      }
    }
    return aplicarOptouts(result)
  }

  if (para === "lista" && listas && listas.length > 0) {
    const contatos = await db
      .select({ email: emailListaContatos.email, nome: emailListaContatos.nome })
      .from(emailListaContatos)
      .where(inArray(emailListaContatos.listaId, listas))
    const result: Destinatario[] = []
    for (const c of contatos) {
      for (const addr of parseEmails(c.email)) {
        result.push({ email: addr, nome: c.nome || "Contato" })
      }
    }
    return aplicarOptouts(result)
  }

  return []
}

export function parseEmails(emailField: string | null | undefined): string[] {
  if (!emailField || !emailField.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of emailField.split(/[,;\n]/)) {
    const addr = e.trim()
    if (!EMAIL_REGEX.test(addr)) continue
    const key = addr.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(addr)
  }
  return out
}

export function montarLinkDescadastro(email: string, baseUrl: string): string {
  const url = new URL("/api/email/unsubscribe", baseUrl)
  url.searchParams.set("email", email)
  return url.toString()
}

export function injectUnsubscribe(html: string, email: string, baseUrl: string): string {
  const link = montarLinkDescadastro(email, baseUrl)
  const htmlLink = `<a href="${link}" style="color:#999999;text-decoration:underline;font-size:11px;">cancelar inscrição</a>`
  if (html.includes("</body>")) {
    return html.replace(
      "</body>",
      `<div style="text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#999999;padding:12px 0;">Recebeu este e-mail porque está cadastrado. Se não quiser mais receber, ${htmlLink}.</div></body>`
    )
  }
  return `${html}<div style="text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#999999;padding:12px 0;">Recebeu este e-mail porque está cadastrado. Se não quiser mais receber, ${htmlLink}.</div>`
}

export function injectTrackingPixel(html: string, trackingId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/admin/email-massa/tracking/${trackingId}`
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`)
  }
  return html + pixel
}

export function injectLinkTracking(html: string, trackingId: string, baseUrl: string): string {
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

export function aplicarTracking(html: string, trackingId: string, baseUrl: string): string {
  return injectLinkTracking(injectTrackingPixel(html, trackingId, baseUrl), trackingId, baseUrl)
}

export function injectPreheader(html: string, preheader: string): string {
  if (!preheader) return html
  const tag = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;" aria-hidden="true">${preheader}&zwnj;&nbsp;</div>`
  if (html.includes("<body")) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${tag}`)
  }
  return tag + html
}

export async function criarDisparo(params: {
  nome?: string
  para: string
  listas?: number[]
  assunto: string
  html: string
  preheader?: string
  modoEnvio?: string
  remetente?: string
  remessaId?: string
  criadoPor?: number
}) {
  const destinatarios = await buscarDestinatarios(params.para, params.listas)
  if (destinatarios.length === 0) return null

  const remessaId = params.remessaId || crypto.randomUUID()
  const [disparo] = await db
    .insert(emailDisparos)
    .values({
      nome: params.nome || "",
      para: params.para,
      listas: params.listas || null,
      assunto: params.assunto,
      html: params.html,
      preheader: params.preheader || "",
      modoEnvio: params.modoEnvio || "bcc",
      remetente: params.remetente || "sistema",
      remessaId,
      status: "fila",
      total: destinatarios.length,
      criadoPor: params.criadoPor,
    })
    .returning({ id: emailDisparos.id })

  const disparoId = disparo.id
  const rows = destinatarios.map((d) => ({
    disparoId,
    remessaId,
    email: d.email,
    nome: d.nome || null,
    assunto: params.assunto,
    status: "pendente",
  }))

  for (let i = 0; i < rows.length; i += 1000) {
    await db.insert(emailEnviados).values(rows.slice(i, i + 1000))
  }

  return { id: disparoId, remessaId, total: destinatarios.length }
}
