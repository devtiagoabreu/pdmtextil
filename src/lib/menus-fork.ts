import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, and, asc, isNull } from "drizzle-orm"

/**
 * Garante que o usuário tenha uma cópia pessoal dos menus de um role.
 *
 * É idempotente: se o usuário já tem menus pessoais, não duplica — reutiliza os
 * existentes casando por título e retorna o mapa roleMenuId -> menuPessoalId.
 * Antes, cada chamada criava um conjunto pessoal completo novo, o que gerava
 * gerações duplicadas de menus/itens no banco.
 */
export async function forkRoleMenusToUser(userId: number, roleName: string) {
  const idMap = new Map<number, number>()

  const existentes = await db
    .select()
    .from(userMenus)
    .where(eq(userMenus.usuarioId, userId))

  const porTitulo = new Map<string, (typeof existentes)[number]>()
  for (const m of existentes) {
    if (!porTitulo.has(m.titulo)) porTitulo.set(m.titulo, m)
  }

  const menus = await db
    .select()
    .from(userMenus)
    .where(and(eq(userMenus.role, roleName), isNull(userMenus.usuarioId)))
    .orderBy(asc(userMenus.ordem))

  for (const menu of menus) {
    const existente = porTitulo.get(menu.titulo)
    if (existente) {
      idMap.set(menu.id, existente.id)
      continue
    }

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
