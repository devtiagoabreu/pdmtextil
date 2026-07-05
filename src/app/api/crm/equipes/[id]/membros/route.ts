import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEquipeMembros } from "@/lib/db/schema/crm-equipe-membros"
import { representantes } from "@/lib/db/schema/representantes"
import { eq, desc } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const membros = await db
      .select({
        id: crmEquipeMembros.id,
        equipeId: crmEquipeMembros.equipeId,
        representanteId: crmEquipeMembros.representanteId,
        nome: representantes.nome,
        cnpj: representantes.cnpj,
        cidade: representantes.cidade,
        uf: representantes.uf,
        email: representantes.email,
        telefone: representantes.telefone,
        createdAt: crmEquipeMembros.createdAt,
      })
      .from(crmEquipeMembros)
      .innerJoin(representantes, eq(crmEquipeMembros.representanteId, representantes.id))
      .where(eq(crmEquipeMembros.equipeId, parseInt(id)))
      .orderBy(desc(crmEquipeMembros.createdAt))

    return NextResponse.json(membros)
  } catch (error) {
    console.error("[GET /api/crm/equipes/[id]/membros]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await req.json()
    const { representanteId } = body

    if (!representanteId) {
      return NextResponse.json({ error: "representanteId é obrigatório" }, { status: 400 })
    }

    const [existente] = await db
      .select()
      .from(crmEquipeMembros)
      .where(eq(crmEquipeMembros.equipeId, parseInt(id)))
      .where(eq(crmEquipeMembros.representanteId, representanteId))
      .limit(1)

    if (existente) {
      return NextResponse.json({ error: "Representante já está nesta equipe" }, { status: 409 })
    }

    const [novo] = await db
      .insert(crmEquipeMembros)
      .values({
        equipeId: parseInt(id),
        representanteId,
      })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/equipes/[id]/membros]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const membroId = searchParams.get("membroId")

    if (membroId) {
      await db
        .delete(crmEquipeMembros)
        .where(eq(crmEquipeMembros.id, parseInt(membroId)))
        .where(eq(crmEquipeMembros.equipeId, parseInt(id)))
    } else {
      const body = await req.json()
      await db
        .delete(crmEquipeMembros)
        .where(eq(crmEquipeMembros.equipeId, parseInt(id)))
        .where(eq(crmEquipeMembros.representanteId, body.representanteId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/equipes/[id]/membros]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
