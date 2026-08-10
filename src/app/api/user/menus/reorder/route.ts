import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { forkRoleMenusToUser } from "@/lib/menus-fork"
import { eq, and, asc, isNull, inArray } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

async function carregarMenus(usuarioId: number) {
  const menus = await db
    .select()
    .from(userMenus)
    .where(eq(userMenus.usuarioId, usuarioId))
    .orderBy(asc(userMenus.ordem))

  if (menus.length === 0) return []

  const menuIds = menus.map((m: any) => m.id)
  const todosItens = await db
    .select()
    .from(userMenuItens)
    .where(inArray(userMenuItens.userMenuId, menuIds))
    .orderBy(asc(userMenuItens.ordem))

  const itensPorMenu: Record<number, typeof todosItens> = {}
  for (const item of todosItens) {
    if (!itensPorMenu[item.userMenuId]) itensPorMenu[item.userMenuId] = []
    itensPorMenu[item.userMenuId].push(item)
  }

  return menus.map((menu: any) => ({
    ...menu,
    itens: itensPorMenu[menu.id] || [],
  }))
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId
    const userRole = auth.session?.user?.role

    const body = await req.json()
    const { ids } = body
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Lista de IDs inválida" }, { status: 400 })
    }

    // Verificar se algum menu é role-based (não pertence ao usuário)
    const menus = await db
      .select()
      .from(userMenus)
      .where(and(eq(userMenus.usuarioId, userId)))

    const ownedIds = new Set(menus.map((m: any) => m.id))
    const needsFork = ids.some((id: any) => !ownedIds.has(id))

    const idMap = new Map<number, number>()
    if (needsFork) {
      // Buscar o role do primeiro menu role-based do papel do usuário
      let [roleMenu] = userRole
        ? await db
            .select()
            .from(userMenus)
            .where(and(isNull(userMenus.usuarioId), eq(userMenus.role, userRole)))
        : []

      if (!roleMenu) {
        ;[roleMenu] = await db.select().from(userMenus).where(isNull(userMenus.usuarioId))
      }

      if (!roleMenu || !roleMenu.role) {
        return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
      }

      const forkIdMap = await forkRoleMenusToUser(userId, roleMenu.role)
      forkIdMap.forEach((novoId: any, antigoId: any) => idMap.set(antigoId, novoId))
    }

    // Atualizar ordem em lote
    for (let i = 0; i < ids.length; i++) {
      const originalId = ids[i]
      const resolvedId = idMap.get(originalId) ?? originalId
      await db
        .update(userMenus)
        .set({ ordem: i })
        .where(and(eq(userMenus.id, resolvedId), eq(userMenus.usuarioId, userId)))
    }

    const result = await carregarMenus(userId)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, "UserMenosReorder")
  }
}
