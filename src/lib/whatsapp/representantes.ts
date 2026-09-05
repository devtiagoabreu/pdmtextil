import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { crmWhatsappDestinatarios } from "@/lib/db/schema/crm-whatsapp-destinatarios"
import { and, eq, isNotNull } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"
import { sendEmail } from "@/lib/email"

const FALLBACK_PJ = process.env.WHATSAPP_REPRESENTANTE_PJ || "5519999999999"
const FALLBACK_PF = process.env.WHATSAPP_REPRESENTANTE_PF || "5519999999998"

function limparNumero(n: string): string {
  return n.replace(/\D/g, "")
}

function numeroValido(n: string): boolean {
  return n.length >= 10 && n.length <= 13
}

export interface Destinatario {
  usuarioId: number
  nome: string | null
  email: string | null
  celWhatsapp: string | null
}

export async function obterDestinatarios(tipoPessoa: "PJ" | "PF"): Promise<Destinatario[]> {
  try {
    const linhas = (await db
      .select({
        usuarioId: crmWhatsappDestinatarios.usuarioId,
        nome: usuarios.name,
        email: usuarios.email,
        celWhatsapp: usuarios.celWhatsapp,
      })
      .from(crmWhatsappDestinatarios)
      .innerJoin(usuarios, eq(crmWhatsappDestinatarios.usuarioId, usuarios.id))
      .where(eq(crmWhatsappDestinatarios.tipoPessoa, tipoPessoa))) as Destinatario[]

    return linhas
  } catch {
    // tabela ainda não migrada em algum banco → trata como sem configuração
    return []
  }
}

export async function obterRepresentantes(tipoPessoa: "PJ" | "PF"): Promise<string[]> {
  const configurados = await obterDestinatarios(tipoPessoa)
  const numeros = configurados
    .map(r => limparNumero(r.celWhatsapp || ""))
    .filter(numeroValido)
  if (numeros.length > 0) return numeros

  const linhas = (await db
    .select({ celWhatsapp: usuarios.celWhatsapp })
    .from(usuarios)
    .where(and(eq(usuarios.ativo, true), isNotNull(usuarios.celWhatsapp)))) as { celWhatsapp: string | null }[]

  const ativos = linhas
    .map(r => limparNumero(r.celWhatsapp || ""))
    .filter(numeroValido)

  if (ativos.length > 0) return ativos
  return [tipoPessoa === "PJ" ? FALLBACK_PJ : FALLBACK_PF]
}

export async function notificarRepresentantes(mensagem: string, tipoPessoa: "PJ" | "PF"): Promise<void> {
  if (!evolutionConfigurado()) return
  const numeros = await obterRepresentantes(tipoPessoa)
  for (const numero of numeros) {
    try {
      await enviarMensagem(`${numero}@s.whatsapp.net`, mensagem)
    } catch {
      // não derruba o fluxo se um representante falhar
    }
  }
}

export async function notificarDestinatariosEmail(info: {
  tipoPessoa: "PJ" | "PF"
  assunto: string
  html: string
  destinatarios?: Destinatario[]
}): Promise<void> {
  const lista = info.destinatarios ?? (await obterDestinatarios(info.tipoPessoa))
  const emails = lista
    .map(d => d.email)
    .filter((e): e is string => !!e && e.includes("@"))
  if (emails.length === 0) return

  try {
    await sendEmail({ to: emails, subject: info.assunto, html: info.html })
  } catch {
    // não derruba o fluxo se o envio de email falhar
  }
}