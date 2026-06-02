import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { emailListaContatos } from "@/lib/db/schema/email-listas"
import { eq, inArray } from "drizzle-orm"
import { sendEmail, parseEmails } from "@/lib/email"
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { para, assunto, html, listas, modo_envio } = body

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

    let enviados = 0
    let total = 0
    const erros: string[] = []

    if (modo_envio === "individual") {
      for (const d of destinatarios) {
        total++
        const personalizado = html.replace(/\[NOME\]/g, d.nome)
        const result = await sendEmail({ to: d.email, subject: assunto, html: personalizado })
        enviados += result.sent
        if (result.error) erros.push(`${d.email}: ${result.error}`)
      }
    } else {
      const personalizado = html.replace(/\[NOME\]/g, "Cliente")
      total = destinatarios.length

      if (modo_envio === "bcc") {
        const result = await sendEmail({
          to: destinatarios[0].email,
          subject: assunto,
          html: personalizado,
          bcc: destinatarios.slice(1).map(d => d.email),
        })
        enviados = result.sent
        if (result.error) erros.push(result.error)
      } else {
        for (const d of destinatarios) {
          const result = await sendEmail({ to: d.email, subject: assunto, html: personalizado })
          enviados += result.sent
          if (result.error) erros.push(`${d.email}: ${result.error}`)
        }
      }
    }

    return NextResponse.json({ success: enviados > 0, total, enviados, erros: erros.slice(0, 10) })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa]", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar emails" }, { status: 500 })
  }
}
