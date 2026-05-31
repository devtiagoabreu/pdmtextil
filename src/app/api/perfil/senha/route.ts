import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

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
