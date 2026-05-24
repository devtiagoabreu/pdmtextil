import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserId } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userIdResult = getUserId(session)
    if (userIdResult instanceof NextResponse) return userIdResult

    const { password } = await req.json()

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)

    await db
      .update(usuarios)
      .set({ password: hash, updatedAt: new Date() })
      .where(eq(usuarios.id, userIdResult))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/perfil/senha]", error)
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 })
  }
}
