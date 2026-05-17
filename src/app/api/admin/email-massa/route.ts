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

    const destinatarios: string[] = []

    if (para === "clientes") {
      const lista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
      for (const c of lista) {
        const emails = parseEmails(c.email)
        if (emails.length > 0) {
          const personalizado = html.replace(/\[NOME\]/g, c.nome || "Cliente")
          await sendEmail({ to: emails, subject: assunto, html: personalizado })
        }
      }
      return NextResponse.json({ success: true, totalClientes: lista.length })
    }

    if (para === "usuarios") {
      const lista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))
      for (const u of lista) {
        if (u.email && u.email.includes("@")) {
          const personalizado = html.replace(/\[NOME\]/g, u.name || "Usuário")
          await sendEmail({ to: u.email, subject: assunto, html: personalizado })
        }
      }
      return NextResponse.json({ success: true, totalUsuarios: lista.length })
    }

    if (para === "todos") {
      const clientesLista = await db.select({ email: clientes.email, nome: clientes.nome }).from(clientes).where(eq(clientes.ativo, true))
      const usuariosLista = await db.select({ email: usuarios.email, name: usuarios.name }).from(usuarios).where(eq(usuarios.ativo, true))

      for (const c of clientesLista) {
        const emails = parseEmails(c.email)
        if (emails.length > 0) {
          const personalizado = html.replace(/\[NOME\]/g, c.nome || "Cliente")
          await sendEmail({ to: emails, subject: assunto, html: personalizado })
        }
      }
      for (const u of usuariosLista) {
        if (u.email && u.email.includes("@")) {
          const personalizado = html.replace(/\[NOME\]/g, u.name || "Usuário")
          await sendEmail({ to: u.email, subject: assunto, html: personalizado })
        }
      }
      return NextResponse.json({ success: true, totalClientes: clientesLista.length, totalUsuarios: usuariosLista.length })
    }

    return NextResponse.json({ error: "Tipo de destinatário inválido" }, { status: 400 })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa]", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar emails" }, { status: 500 })
  }
}
