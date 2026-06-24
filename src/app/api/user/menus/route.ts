import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus, userMenuItens } from "@/lib/db/schema/user-menus"
import { eq, asc, and } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

async function carregarMenus(params: { usuarioId?: number; role?: string }) {
  const condicoes = []
  if (params.usuarioId) condicoes.push(eq(userMenus.usuarioId, params.usuarioId))
  if (params.role) condicoes.push(eq(userMenus.role, params.role))

  const menus = await db
    .select()
    .from(userMenus)
    .where(condicoes.length > 0 ? and(...condicoes) : undefined)
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

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId
    const session = auth.session

    // 1. Tentar menus do usuário
    let result = await carregarMenus({ usuarioId: userId })
    if (result.length > 0) return NextResponse.json(result)

    // 2. Tentar menus do role do usuário
    const userRole = session?.user?.role
    if (userRole) {
      result = await carregarMenus({ role: userRole })
      if (result.length > 0) return NextResponse.json(result)
    }

    // 3. Tentar menus DEFAULT
    result = await carregarMenus({ role: "DEFAULT" })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, "UserMenosList")
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await req.json()
    if (!body.titulo) return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })

    const [menu] = await db
      .insert(userMenus)
      .values({ usuarioId: userId, titulo: body.titulo, icone: body.icone, ordem: body.ordem || 0 })
      .returning()

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    return handleApiError(error, "UserMenosCreate")
  }
}
