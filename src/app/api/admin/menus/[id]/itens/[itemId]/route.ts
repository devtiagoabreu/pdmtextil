import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, and } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"
import { validarUrlRotina } from "@/lib/rotina-url"

async function requireAdmin() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const role = auth.session?.user?.role
  if (role !== "ADMIN" && role !== "SUDO") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
  }
  return auth
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin
    const { id, itemId } = await params
    const menuId = parseInt(id)
    const itemIdNum = parseInt(itemId)
    if (isNaN(menuId) || isNaN(itemIdNum)) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })

    const body = await req.json()
    if (body.url) {
      const [menu] = await db.select().from(userMenus).where(eq(userMenus.id, menuId))
      if (!menu) return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })

      const erroUrl = validarUrlRotina(body.url, menu.role === "ADMIN" || menu.role === "SUDO")
      if (erroUrl) return NextResponse.json({ error: erroUrl }, { status: 400 })
    }

    const [updated] = await db
      .update(userMenuItens)
      .set({ titulo: body.titulo, url: body.url, ordem: body.ordem })
      .where(and(eq(userMenuItens.id, itemIdNum), eq(userMenuItens.userMenuId, menuId)))
      .returning()

    if (!updated) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error, "AdminMenuItensUpdate")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin
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
    return handleApiError(error, "AdminMenuItensDelete")
  }
}
