import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { roles } from "@/lib/db/schema/roles"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const lista = await db.select().from(roles).orderBy(roles.label)
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/roles]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    if (!body.name || !body.label) {
      return NextResponse.json({ error: "name e label são obrigatórios" }, { status: 400 })
    }

    const [novo] = await db.insert(roles).values({
      name: body.name.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      label: body.label,
      description: body.description || null,
      permissions: body.permissions || {},
      ativo: body.ativo ?? true,
    }).returning()

    return NextResponse.json(novo)
  } catch (error: any) {
    if (error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Role name já existe" }, { status: 400 })
    }
    console.error("[POST /api/admin/roles]", error)
    return NextResponse.json({ error: "Erro ao criar role" }, { status: 500 })
  }
}
