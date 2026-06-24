import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, and } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireAuth()
    const { id, itemId } = await params
    const menuId = parseInt(id)
    const itemIdNum = parseInt(itemId)
    if (isNaN(menuId) || isNaN(itemIdNum)) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })

    const body = await req.json()
    const [updated] = await db
      .update(userMenuItens)
      .set({ titulo: body.titulo, url: body.url, ordem: body.ordem })
      .where(and(eq(userMenuItens.id, itemIdNum), eq(userMenuItens.userMenuId, menuId)))
      .returning()

    if (!updated) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error, "UserMenuItensUpdate")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireAuth()
    const { id, itemId } = await params
    const menuId = parseInt(id)
    const itemIdNum = parseInt(itemId)
    if (isNaN(menuId) || isNaN(itemIdNum)) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })

    const [deleted] = await db
      .delete(userMenuItens)
      .where(and(eq(userMenuItens.id, itemIdNum), eq(userMenuItens.userMenuId, menuId)))
      .returning()

    if (!deleted) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "UserMenuItensDelete")
  }
}
