import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { roles as rolesTable } from "@/lib/db/schema/roles"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId
    const userRole = auth.session?.user?.role

    // 1. Página inicial personalizada do usuário
    const [user] = await db
      .select({ paginaInicial: usuarios.paginaInicial })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    if (user?.paginaInicial) return NextResponse.json({ paginaInicial: user.paginaInicial }, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
    })

    // 2. Página inicial configurada para o role do usuário
    if (userRole) {
      const [role] = await db
        .select({ paginaInicial: rolesTable.paginaInicial })
        .from(rolesTable)
        .where(eq(rolesTable.name, userRole))
        .limit(1)

      if (role?.paginaInicial) return NextResponse.json({ paginaInicial: role.paginaInicial }, {
        headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
      })
    }

    // 3. Página inicial do role DEFAULT
    const [defaultRole] = await db
      .select({ paginaInicial: rolesTable.paginaInicial })
      .from(rolesTable)
      .where(eq(rolesTable.name, "DEFAULT"))
      .limit(1)

    if (defaultRole?.paginaInicial) return NextResponse.json({ paginaInicial: defaultRole.paginaInicial }, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
    })

    // 4. Fallback
    return NextResponse.json({ paginaInicial: "/comercial/solicitacoes" }, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
    })
  } catch (error) {
    return handleApiError(error, "PaginaInicialGet")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await req.json()
    if (!body.paginaInicial) return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 })

    await db
      .update(usuarios)
      .set({ paginaInicial: body.paginaInicial })
      .where(eq(usuarios.id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "PaginaInicialUpdate")
  }
}
