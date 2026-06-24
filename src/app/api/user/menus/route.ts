import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, asc } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const menus = await db
      .select()
      .from(userMenus)
      .where(eq(userMenus.usuarioId, userId))
      .orderBy(asc(userMenus.ordem))

    const result = []
    for (const menu of menus) {
      const itens = await db
        .select()
        .from(userMenuItens)
        .where(eq(userMenuItens.userMenuId, menu.id))
        .orderBy(asc(userMenuItens.ordem))
      result.push({ ...menu, itens })
    }

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, "UserMenosList")
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await req.json()
    if (!body.titulo) return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })

    const [menu] = await db
      .insert(userMenus)
      .values({ usuarioId: userId, titulo: body.titulo, icone: body.icone, ordem: body.ordem || 0 })
      .returning()

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    return handleApiError(error, "UserMenosCreate")
  }
}
