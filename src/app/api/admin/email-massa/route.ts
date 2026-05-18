import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { sendEmail, parseEmails } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { para, assunto, html } = body

    if (!para || !assunto || !html) {
      return NextResponse.json({ error: "Para, assunto e conteúdo são obrigatórios" }, { status: 400 })
    }

    if (para === "clientes") {
      const lista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
      let enviados = 0
      let total = 0
      const erros: string[] = []
      for (const c of lista) {
        const emails = parseEmails(c.email)
        for (const addr of emails) {
          total++
          const personalizado = html.replace(/\[NOME\]/g, c.nome || "Cliente")
          const result = await sendEmail({ to: addr, subject: assunto, html: personalizado })
          enviados += result.sent
          if (result.error) erros.push(`${addr}: ${result.error}`)
        }
      }
      return NextResponse.json({ success: enviados > 0, total: total, enviados, erros: erros.slice(0, 10) })
    }

    if (para === "usuarios") {
      const lista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))
      let enviados = 0
      let total = 0
      const erros: string[] = []
      for (const u of lista) {
        if (u.email && u.email.includes("@")) {
          total++
          const personalizado = html.replace(/\[NOME\]/g, u.name || "Usuário")
          const result = await sendEmail({ to: u.email, subject: assunto, html: personalizado })
          enviados += result.sent
          if (result.error) erros.push(`${u.email}: ${result.error}`)
        }
      }
      return NextResponse.json({ success: enviados > 0, total, enviados, erros: erros.slice(0, 10) })
    }

    if (para === "todos") {
      const clientesLista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
      const usuariosLista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))
      let enviados = 0
      let total = 0
      const erros: string[] = []

      for (const c of clientesLista) {
        const emails = parseEmails(c.email)
        for (const addr of emails) {
          total++
          const personalizado = html.replace(/\[NOME\]/g, c.nome || "Cliente")
          const result = await sendEmail({ to: addr, subject: assunto, html: personalizado })
          enviados += result.sent
          if (result.error) erros.push(`${addr}: ${result.error}`)
        }
      }
      for (const u of usuariosLista) {
        if (u.email && u.email.includes("@")) {
          total++
          const personalizado = html.replace(/\[NOME\]/g, u.name || "Usuário")
          const result = await sendEmail({ to: u.email, subject: assunto, html: personalizado })
          enviados += result.sent
          if (result.error) erros.push(`${u.email}: ${result.error}`)
        }
      }
      return NextResponse.json({ success: enviados > 0, total, enviados, erros: erros.slice(0, 10) })
    }

    return NextResponse.json({ error: "Tipo de destinatário inválido" }, { status: 400 })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa]", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar emails" }, { status: 500 })
  }
}
