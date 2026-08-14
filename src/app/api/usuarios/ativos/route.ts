import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { and, eq, inArray } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const roles = (searchParams.get("role") || "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)

    const condicoes = roles.length > 0
      ? and(eq(usuarios.ativo, true), inArray(usuarios.role, roles))
      : eq(usuarios.ativo, true)

    const lista = await db
      .select({ id: usuarios.id, name: usuarios.name, role: usuarios.role })
      .from(usuarios)
      .where(condicoes)
      .orderBy(usuarios.name)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/usuarios/ativos]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
