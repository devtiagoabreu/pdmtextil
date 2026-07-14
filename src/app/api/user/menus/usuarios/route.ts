import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, asc } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const lista = await db
      .select({
        id: usuarios.id,
        name: usuarios.name,
      })
      .from(usuarios)
      .where(eq(usuarios.ativo, true))
      .orderBy(asc(usuarios.name))

    return NextResponse.json(lista.filter(u => u.id !== userId))
  } catch (error) {
    return handleApiError(error, "ListarUsuariosMenus")
  }
}
