import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const [user] = await db
      .select({ paginaInicial: usuarios.paginaInicial })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    return NextResponse.json({ paginaInicial: user?.paginaInicial || "/dashboard" })
  } catch (error) {
    return handleApiError(error, "PaginaInicialGet")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await req.json()
    if (!body.paginaInicial) return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 })

    await db
      .update(usuarios)
      .set({ paginaInicial: body.paginaInicial })
      .where(eq(usuarios.id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "PaginaInicialUpdate")
  }
}
