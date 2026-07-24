import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailAgendados } from "@/lib/db/schema/email-agendados"
import { desc, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const agendados = await db.select().from(emailAgendados).orderBy(desc(emailAgendados.createdAt))
    return NextResponse.json(agendados)
  } catch (error) {
    console.error("[GET /api/admin/email-massa/agendados]", error)
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    const { nome, para, assunto, html, listas, modoEnvio, remetente, agendadoPara, status, preheader } = body

    if (!para || !assunto || !html) {
      return NextResponse.json({ error: "para, assunto e html são obrigatórios" }, { status: 400 })
    }

    if (status === "agendado" && !agendadoPara) {
      return NextResponse.json({ error: "Data/hora do agendamento é obrigatória" }, { status: 400 })
    }

    const [result] = await db.insert(emailAgendados).values({
      nome: nome || "",
      para,
      assunto,
      preheader: preheader || "",
      html,
      listas: listas || null,
      modoEnvio: modoEnvio || "bcc",
      remetente: remetente || "sistema",
      agendadoPara: agendadoPara ? new Date(agendadoPara) : null,
      status: status || "rascunho",
      criadoPor: Number(session.user?.id) || null,
    }).returning()

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/email-massa/agendados]", error)
    return NextResponse.json({ error: "Erro ao criar agendamento" }, { status: 500 })
  }
}
