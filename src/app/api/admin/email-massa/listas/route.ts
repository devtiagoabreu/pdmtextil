import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailListas } from "@/lib/db/schema/email-listas"
import { desc, eq, sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const lista = await db.select({
      id: emailListas.id,
      nome: emailListas.nome,
      descricao: emailListas.descricao,
      createdAt: emailListas.createdAt,
      updatedAt: emailListas.updatedAt,
      totalContatos: sql<number>`(SELECT count(*) FROM email_lista_contatos WHERE email_lista_contatos.lista_id = email_listas.id)`,
    }).from(emailListas).orderBy(desc(emailListas.updatedAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/email-massa/listas]", error)
    return NextResponse.json({ error: "Erro ao listar listas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    if (!body.nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const [nova] = await db.insert(emailListas).values({
      nome: body.nome,
      descricao: body.descricao || null,
    }).returning()

    return NextResponse.json(nova)
  } catch (error) {
    console.error("[POST /api/admin/email-massa/listas]", error)
    return NextResponse.json({ error: "Erro ao criar lista" }, { status: 500 })
  }
}
