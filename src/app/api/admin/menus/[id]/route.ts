import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus } from "@/lib/db/schema/user-menus"
import { eq, and } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

async function requireAdmin() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const role = auth.session?.user?.role
  if (role !== "ADMIN" && role !== "SUDO") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
  }
  return auth
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const menuId = parseInt(id)
    if (isNaN(menuId)) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })

    const body = await req.json()
    const [updated] = await db
      .update(userMenus)
      .set({ titulo: body.titulo, icone: body.icone, ordem: body.ordem })
      .where(eq(userMenus.id, menuId))
      .returning()

    if (!updated) return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error, "AdminMenusUpdate")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const menuId = parseInt(id)
    if (isNaN(menuId)) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })

    const [deleted] = await db
      .delete(userMenus)
      .where(eq(userMenus.id, menuId))
      .returning()

    if (!deleted) return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "AdminMenusDelete")
  }
}
