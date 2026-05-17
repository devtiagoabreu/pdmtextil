import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { roles } from "@/lib/db/schema/roles"
import { eq } from "drizzle-orm"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    await db.update(roles).set({
      name: body.name?.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      label: body.label,
      description: body.description ?? null,
      permissions: body.permissions ?? undefined,
      ativo: body.ativo ?? true,
      updatedAt: new Date(),
    }).where(eq(roles.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Nome de role já existe" }, { status: 400 })
    }
    console.error("[PUT /api/admin/roles/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar role" }, { status: 500 })
  }
}
