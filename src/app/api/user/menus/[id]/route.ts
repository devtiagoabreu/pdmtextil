import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, and, asc, isNull } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

async function forkRoleMenusToUser(userId: number, roleName: string) {
  const idMap = new Map<number, number>()

  const menus = await db
    .select()
    .from(userMenus)
    .where(and(eq(userMenus.role, roleName), isNull(userMenus.usuarioId)))
    .orderBy(asc(userMenus.ordem))

  for (const menu of menus) {
    const [novo] = await db
      .insert(userMenus)
      .values({ usuarioId: userId, titulo: menu.titulo, icone: menu.icone, ordem: menu.ordem })
      .returning()

    idMap.set(menu.id, novo.id)

    const itens = await db
      .select()
      .from(userMenuItens)
      .where(eq(userMenuItens.userMenuId, menu.id))
      .orderBy(asc(userMenuItens.ordem))

    for (const item of itens) {
      await db
        .insert(userMenuItens)
        .values({ userMenuId: novo.id, titulo: item.titulo, url: item.url, ordem: item.ordem })
    }
  }

  return idMap
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId
    const userRole = auth.session?.user?.role
    const { id } = await params
    const menuId = parseInt(id)
    if (isNaN(menuId)) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })

    const body = await req.json()

    // Verificar se o menu pertence ao usuário
    let [menu] = await db
      .select()
      .from(userMenus)
      .where(and(eq(userMenus.id, menuId), eq(userMenus.usuarioId, userId)))

    // Se não pertence ao usuário, é role-based → fork
    if (!menu) {
      const [roleMenu] = await db
        .select()
        .from(userMenus)
        .where(eq(userMenus.id, menuId))

      if (!roleMenu || roleMenu.usuarioId !== null || !roleMenu.role) {
        return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
      }

      const idMap = await forkRoleMenusToUser(userId, roleMenu.role)
      const newId = idMap.get(menuId)
      if (!newId) return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })

      // Aplica a edição no menu recém-forkado
      const [updated] = await db
        .update(userMenus)
        .set({ titulo: body.titulo, icone: body.icone, ordem: body.ordem })
        .where(eq(userMenus.id, newId))
        .returning()

      return NextResponse.json(updated)
    }

    const [updated] = await db
      .update(userMenus)
      .set({ titulo: body.titulo, icone: body.icone, ordem: body.ordem })
      .where(and(eq(userMenus.id, menuId), eq(userMenus.usuarioId, userId)))
      .returning()

    if (!updated) return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error, "UserMenosUpdate")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId
    const userRole = auth.session?.user?.role
    const { id } = await params
    const menuId = parseInt(id)
    if (isNaN(menuId)) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })

    // Verificar se o menu pertence ao usuário
    let [menu] = await db
      .select()
      .from(userMenus)
      .where(and(eq(userMenus.id, menuId), eq(userMenus.usuarioId, userId)))

    // Se não pertence ao usuário, é role-based → fork
    if (!menu) {
      const [roleMenu] = await db
        .select()
        .from(userMenus)
        .where(eq(userMenus.id, menuId))

      if (!roleMenu || roleMenu.usuarioId !== null || !roleMenu.role) {
        return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
      }

      const idMap = await forkRoleMenusToUser(userId, roleMenu.role)
      const newId = idMap.get(menuId)
      if (!newId) return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })

      // Deleta o menu recém-forkado
      await db
        .delete(userMenus)
        .where(eq(userMenus.id, newId))

      return NextResponse.json({ success: true })
    }

    const [deleted] = await db
      .delete(userMenus)
      .where(and(eq(userMenus.id, menuId), eq(userMenus.usuarioId, userId)))
      .returning()

    if (!deleted) return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "UserMenosDelete")
  }
}
