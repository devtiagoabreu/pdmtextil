import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailListas, emailListaContatos } from "@/lib/db/schema/email-listas"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = Number(params.id)
    const [lista] = await db.select().from(emailListas).where(eq(emailListas.id, id))
    if (!lista) {
      return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
    }

    const contatos = await db.select().from(emailListaContatos).where(eq(emailListaContatos.listaId, id))
    return NextResponse.json({ ...lista, contatos })
  } catch (error) {
    console.error("[GET /api/admin/email-massa/listas]", error)
    return NextResponse.json({ error: "Erro ao buscar lista" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = Number(params.id)
    const body = await req.json()
    if (!body.nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const [atualizada] = await db.update(emailListas)
      .set({ nome: body.nome, descricao: body.descricao || null, updatedAt: new Date() })
      .where(eq(emailListas.id, id))
      .returning()

    if (!atualizada) {
      return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PUT /api/admin/email-massa/listas]", error)
    return NextResponse.json({ error: "Erro ao atualizar lista" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = Number(params.id)
    await db.delete(emailListas).where(eq(emailListas.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/email-massa/listas]", error)
    return NextResponse.json({ error: "Erro ao deletar lista" }, { status: 500 })
  }
}
