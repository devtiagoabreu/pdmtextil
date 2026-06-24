import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenuItens } from "@/lib/db/schema/user-menus"
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const menuId = parseInt(id)
    if (isNaN(menuId)) return NextResponse.json({ error: "Menu inválido" }, { status: 400 })

    const body = await req.json()
    if (!body.titulo || !body.url) return NextResponse.json({ error: "Título e URL são obrigatórios" }, { status: 400 })

    const [item] = await db
      .insert(userMenuItens)
      .values({ userMenuId: menuId, titulo: body.titulo, url: body.url, ordem: body.ordem || 0 })
      .returning()

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return handleApiError(error, "AdminMenuItensCreate")
  }
}
