import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailModelos } from "@/lib/db/schema/email-modelos"
import { desc, eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const lista = await db.select().from(emailModelos).orderBy(desc(emailModelos.updatedAt))
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/email-massa/modelos]", error)
    return NextResponse.json({ error: "Erro ao listar modelos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    if (!body.nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const [novo] = await db.insert(emailModelos).values({
      nome: body.nome,
      assunto: body.assunto || "",
      html: body.html || "",
    }).returning()

    return NextResponse.json(novo)
  } catch (error) {
    console.error("[POST /api/admin/email-massa/modelos]", error)
    return NextResponse.json({ error: "Erro ao criar modelo" }, { status: 500 })
  }
}
