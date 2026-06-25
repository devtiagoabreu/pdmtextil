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

async function carregarMenus(usuarioId: number) {
  const menus = await db
    .select()
    .from(userMenus)
    .where(eq(userMenus.usuarioId, usuarioId))
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
  return result
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

    const ownedIds = new Set(menus.map(m => m.id))
    const needsFork = ids.some(id => !ownedIds.has(id))

    const idMap = new Map<number, number>()
    if (needsFork) {
      // Buscar o role do primeiro menu role-based
      const [roleMenu] = await db
        .select()
        .from(userMenus)
        .where(and(isNull(userMenus.usuarioId)))

      if (!roleMenu || !roleMenu.role) {
        return NextResponse.json({ error: "Menu não encontrado" }, { status: 404 })
      }

      const forkIdMap = await forkRoleMenusToUser(userId, roleMenu.role)
      forkIdMap.forEach((novoId, antigoId) => idMap.set(antigoId, novoId))
    }

    // Atualizar ordem
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
