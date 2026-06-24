import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { roles } from "@/lib/db/schema/roles"
import { eq } from "drizzle-orm"
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

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const roleName = req.nextUrl.searchParams.get("role") || "DEFAULT"
    const [role] = await db
      .select({ paginaInicial: roles.paginaInicial })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1)

    return NextResponse.json({ paginaInicial: role?.paginaInicial || "" })
  } catch (error) {
    return handleApiError(error, "AdminPaginaInicialRoleGet")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    if (!body.role) return NextResponse.json({ error: "Role é obrigatório" }, { status: 400 })

    await db
      .update(roles)
      .set({ paginaInicial: body.paginaInicial || null })
      .where(eq(roles.name, body.role))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "AdminPaginaInicialRoleUpdate")
  }
}
