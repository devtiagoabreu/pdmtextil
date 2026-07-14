import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, and, asc } from "drizzle-orm"
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

    for (const menu of menusAtuais) {
      await db.delete(userMenuItens).where(eq(userMenuItens.userMenuId, menu.id))
      await db.delete(userMenus).where(eq(userMenus.id, menu.id))
    }

    const novosMenus = []
    for (const menu of menusOrigem) {
      const [novoMenu] = await db
        .insert(userMenus)
        .values({
          usuarioId: userId,
          titulo: menu.titulo,
          icone: menu.icone,
          ordem: menu.ordem,
          ativo: menu.ativo,
        })
        .returning()

      const itensOrigem = await db
        .select()
        .from(userMenuItens)
        .where(eq(userMenuItens.userMenuId, menu.id))
        .orderBy(asc(userMenuItens.ordem))

      const novosItens = []
      for (const item of itensOrigem) {
        const [novoItem] = await db
          .insert(userMenuItens)
          .values({
            userMenuId: novoMenu.id,
            titulo: item.titulo,
            url: item.url,
            ordem: item.ordem,
            ativo: item.ativo,
          })
          .returning()
        novosItens.push(novoItem)
      }

      novosMenus.push({ ...novoMenu, itens: novosItens })
    }

    return NextResponse.json(novosMenus)
  } catch (error) {
    return handleApiError(error, "CopiarMenus")
  }
}
