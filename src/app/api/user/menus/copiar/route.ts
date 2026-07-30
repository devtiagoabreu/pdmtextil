import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, and, asc, inArray } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { origemUsuarioId } = await req.json()
    if (!origemUsuarioId) {
      return NextResponse.json({ error: "ID do usuário de origem é obrigatório" }, { status: 400 })
    }

    if (origemUsuarioId === userId) {
      return NextResponse.json({ error: "Você não pode copiar menus de si mesmo" }, { status: 400 })
    }

    const menusOrigem = await db
      .select()
      .from(userMenus)
      .where(and(eq(userMenus.usuarioId, origemUsuarioId), eq(userMenus.ativo, true)))
      .orderBy(asc(userMenus.ordem))

    if (menusOrigem.length === 0) {
      return NextResponse.json({ error: "Usuário de origem não possui menus personalizados" }, { status: 404 })
    }

    const menusAtuais = await db
      .select({ id: userMenus.id })
      .from(userMenus)
      .where(eq(userMenus.usuarioId, userId))

    if (menusAtuais.length > 0) {
      const idsAtuais = menusAtuais.map((m: typeof menusAtuais[number]) => m.id)
      await db.delete(userMenuItens).where(inArray(userMenuItens.userMenuId, idsAtuais))
      await db.delete(userMenus).where(inArray(userMenus.id, idsAtuais))
    }

    const novosMenus = await db.insert(userMenus).values(
      menusOrigem.map((menu: typeof menusOrigem[number]) => ({
        usuarioId: userId,
        titulo: menu.titulo,
        icone: menu.icone,
        ordem: menu.ordem,
        ativo: menu.ativo,
      }))
    ).returning()

    const todosItensOrigem = await db
      .select()
      .from(userMenuItens)
      .where(inArray(userMenuItens.userMenuId, menusOrigem.map((m: typeof menusOrigem[number]) => m.id)))
      .orderBy(asc(userMenuItens.ordem))

    const itensPorMenuOrigem = new Map<number, typeof todosItensOrigem>()
    for (const item of todosItensOrigem) {
      if (!itensPorMenuOrigem.has(item.userMenuId)) itensPorMenuOrigem.set(item.userMenuId, [])
      itensPorMenuOrigem.get(item.userMenuId)!.push(item)
    }

    const resultado = []
    for (let i = 0; i < menusOrigem.length; i++) {
      const menuOrigem = menusOrigem[i]
      const novoMenu = novosMenus[i]
      const itensOrigem = itensPorMenuOrigem.get(menuOrigem.id) || []

      const novosItens = itensOrigem.length > 0
        ? await db.insert(userMenuItens).values(
            itensOrigem.map((item: typeof itensOrigem[number]) => ({
              userMenuId: novoMenu.id,
              titulo: item.titulo,
              url: item.url,
              ordem: item.ordem,
              ativo: item.ativo,
            }))
          ).returning()
        : []

      resultado.push({ ...novoMenu, itens: novosItens })
    }

    return NextResponse.json(resultado)
  } catch (error) {
    return handleApiError(error, "CopiarMenus")
  }
}
