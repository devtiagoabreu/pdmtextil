import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, asc, and, inArray } from "drizzle-orm"
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

async function carregarMenus(params: { role: string }) {
  const menus = await db
    .select()
    .from(userMenus)
    .where(eq(userMenus.role, params.role))
    .orderBy(asc(userMenus.ordem))

  if (menus.length === 0) return []

  const menuIds = menus.map((m: typeof menus[number]) => m.id)
  const todosItens = await db
    .select()
    .from(userMenuItens)
    .where(inArray(userMenuItens.userMenuId, menuIds))
    .orderBy(asc(userMenuItens.ordem))

  const itensPorMenu = new Map<number, typeof todosItens>()
  for (const item of todosItens) {
    if (!itensPorMenu.has(item.userMenuId)) itensPorMenu.set(item.userMenuId, [])
    itensPorMenu.get(item.userMenuId)!.push(item)
  }

  return menus.map((menu: typeof menus[number]) => ({ ...menu, itens: itensPorMenu.get(menu.id) || [] }))
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const role = req.nextUrl.searchParams.get("role") || "DEFAULT"

    const result = await carregarMenus({ role })
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, "AdminMenusList")
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    if (!body.titulo || !body.role) {
      return NextResponse.json({ error: "Título e role são obrigatórios" }, { status: 400 })
    }

    const [menu] = await db
      .insert(userMenus)
      .values({ role: body.role, titulo: body.titulo, icone: body.icone, ordem: body.ordem || 0 })
      .returning()

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    return handleApiError(error, "AdminMenusCreate")
  }
}
