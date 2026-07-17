import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailModelos } from "@/lib/db/schema/email-modelos"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const idNum = Number(id)
    const [modelo] = await db.select().from(emailModelos).where(eq(emailModelos.id, idNum))
    if (!modelo) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(modelo)
  } catch (error) {
    console.error("[GET /api/admin/email-massa/modelos]", error)
    return NextResponse.json({ error: "Erro ao buscar modelo" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const idNum = Number(id)
    const body = await req.json()
    if (!body.nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const [atualizado] = await db.update(emailModelos)
      .set({ nome: body.nome, assunto: body.assunto || "", html: body.html || "", updatedAt: new Date() })
      .where(eq(emailModelos.id, idNum))
      .returning()

    if (!atualizado) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/admin/email-massa/modelos]", error)
    return NextResponse.json({ error: "Erro ao atualizar modelo" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const idNum = Number(id)
    await db.delete(emailModelos).where(eq(emailModelos.id, idNum))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/email-massa/modelos]", error)
    return NextResponse.json({ error: "Erro ao deletar modelo" }, { status: 500 })
  }
}
