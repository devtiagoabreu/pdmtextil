import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailAgendados } from "@/lib/db/schema/email-agendados"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = Number(params.id)
    const body = await req.json()
    const { nome, para, assunto, html, listas, modoEnvio, remetente, agendadoPara, status, preheader } = body

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (nome !== undefined) updates.nome = nome
    if (para !== undefined) updates.para = para
    if (assunto !== undefined) updates.assunto = assunto
    if (preheader !== undefined) updates.preheader = preheader
    if (html !== undefined) updates.html = html
    if (listas !== undefined) updates.listas = listas
    if (modoEnvio !== undefined) updates.modoEnvio = modoEnvio
    if (remetente !== undefined) updates.remetente = remetente
    if (agendadoPara !== undefined) updates.agendadoPara = agendadoPara ? new Date(agendadoPara) : null
    if (status !== undefined) updates.status = status

    const [result] = await db.update(emailAgendados).set(updates).where(eq(emailAgendados.id, id)).returning()
    if (!result) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[PUT /api/admin/email-massa/agendados]", error)
    return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = Number(params.id)
    const [result] = await db.delete(emailAgendados).where(eq(emailAgendados.id, id)).returning()
    if (!result) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/email-massa/agendados]", error)
    return NextResponse.json({ error: "Erro ao excluir agendamento" }, { status: 500 })
  }
}
