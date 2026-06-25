import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, and } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const menuId = parseInt(id)
    if (isNaN(menuId)) return NextResponse.json({ error: "Menu inválido" }, { status: 400 })

    const body = await req.json()
    const { ids } = body
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Lista de IDs inválida" }, { status: 400 })
    }

    for (let i = 0; i < ids.length; i++) {
      await db
        .update(userMenuItens)
        .set({ ordem: i })
        .where(and(eq(userMenuItens.id, ids[i]), eq(userMenuItens.userMenuId, menuId)))
    }

    const itens = await db
      .select()
      .from(userMenuItens)
      .where(eq(userMenuItens.userMenuId, menuId))
      .orderBy(userMenuItens.ordem)

    return NextResponse.json(itens)
  } catch (error) {
    return handleApiError(error, "UserMenuItensReorder")
  }
}
