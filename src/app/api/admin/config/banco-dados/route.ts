import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { bancosDados } from "@/lib/db/schema/banco-dados"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const lista = await db.select().from(bancosDados).orderBy(bancosDados.nome)
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/config/banco-dados]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { nome, connectionString } = await req.json()
    if (!nome || !connectionString) {
      return NextResponse.json({ error: "nome e connectionString são obrigatórios" }, { status: 400 })
    }

    const [item] = await db.insert(bancosDados).values({ nome, connectionString }).returning()
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/config/banco-dados]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, nome, connectionString, ativo } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }

    await db.transaction(async (tx) => {
      if (ativo) {
        await tx.update(bancosDados).set({ ativo: false })
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() }
      if (nome !== undefined) updateData.nome = nome
      if (connectionString !== undefined) updateData.connectionString = connectionString
      if (ativo !== undefined) updateData.ativo = ativo

      await tx.update(bancosDados).set(updateData).where(eq(bancosDados.id, id))
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/config/banco-dados]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }

    await db.delete(bancosDados).where(eq(bancosDados.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/config/banco-dados]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
