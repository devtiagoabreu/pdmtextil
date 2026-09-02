import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userEmailConfig } from "@/lib/db/schema/user-email-config"
import { usuarios } from "@/lib/db/schema/usuarios"
import { encrypt, decrypt } from "@/lib/crypto"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const rows = await db
      .select({
        id: userEmailConfig.id,
        usuarioId: userEmailConfig.usuarioId,
        email: userEmailConfig.email,
        host: userEmailConfig.host,
        port: userEmailConfig.port,
        ativo: userEmailConfig.ativo,
        limiteDiario: userEmailConfig.limiteDiario,
        createdAt: userEmailConfig.createdAt,
        updatedAt: userEmailConfig.updatedAt,
        usuarioNome: usuarios.name,
        usuarioEmail: usuarios.email,
      })
      .from(userEmailConfig)
      .innerJoin(usuarios, eq(userEmailConfig.usuarioId, usuarios.id))
      .orderBy(usuarios.name)

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[GET /api/admin/config/user-email]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { usuarioId, email, senhaApp, limiteDiario, ativo } = body

    if (!usuarioId || !email) {
      return NextResponse.json({ error: "Usuário e email são obrigatórios" }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(userEmailConfig)
      .where(eq(userEmailConfig.usuarioId, Number(usuarioId)))
      .limit(1)

    if (existing.length > 0) {
      const updateData: Record<string, any> = {
        email,
        limiteDiario: limiteDiario ?? existing[0].limiteDiario,
        ativo: ativo ?? existing[0].ativo,
        updatedAt: new Date(),
      }
      if (senhaApp) {
        updateData.senhaApp = encrypt(senhaApp)
      }
      await db
        .update(userEmailConfig)
        .set(updateData)
        .where(eq(userEmailConfig.usuarioId, Number(usuarioId)))
    } else {
      if (!senhaApp) {
        return NextResponse.json({ error: "Senha de app é obrigatória para novo cadastro" }, { status: 400 })
      }
      await db.insert(userEmailConfig).values({
        usuarioId: Number(usuarioId),
        email,
        senhaApp: encrypt(senhaApp),
        limiteDiario: limiteDiario ?? 1500,
        ativo: ativo ?? true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/config/user-email]", error)
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const usuarioId = searchParams.get("usuarioId")
    if (!usuarioId) {
      return NextResponse.json({ error: "usuarioId é obrigatório" }, { status: 400 })
    }

    await db
      .delete(userEmailConfig)
      .where(eq(userEmailConfig.usuarioId, Number(usuarioId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/config/user-email]", error)
    return NextResponse.json({ error: "Erro ao remover configuração" }, { status: 500 })
  }
}
