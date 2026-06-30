import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({ id: usuarios.id, name: usuarios.name })
      .from(usuarios)
      .where(eq(usuarios.ativo, true))
      .orderBy(usuarios.name)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/usuarios/ativos]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
