import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserId } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { handleApiError } from "@/lib/api-error"
import { notificarDelecao } from "@/lib/notificar"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const [user] = await db
      .select({
        id: usuarios.id,
        email: usuarios.email,
        name: usuarios.name,
        role: usuarios.role,
        ativo: usuarios.ativo,
        ultimoAcesso: usuarios.ultimoAcesso,
        createdAt: usuarios.createdAt,
      })
      .from(usuarios)
      .where(eq(usuarios.id, parseInt(id)))
      .limit(1)

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error("[GET /api/admin/usuarios/[id]]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {
      name: body.name,
      email: body.email,
      role: body.role,
      ativo: body.ativo,
      idIntegracao: body.idIntegracao || null,
      updatedAt: new Date(),
    }

    if (body.password && body.password.length >= 6) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    await db.update(usuarios).set(updateData).where(eq(usuarios.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[PUT /api/admin/usuarios/[id]]", error)
    if (error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Email já cadastrado para outro usuário" }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userIdResult = getUserId(session)
    if (userIdResult instanceof NextResponse) return userIdResult

    const { id } = await params
    const userId = parseInt(id)

    if (userId === userIdResult) {
      return NextResponse.json({ error: "Você não pode excluir o próprio usuário" }, { status: 400 })
    }

    await db.delete(usuarios).where(eq(usuarios.id, userId))

    await notificarDelecao("Usuário", id, session?.user?.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/usuarios/[id]")
  }
}
