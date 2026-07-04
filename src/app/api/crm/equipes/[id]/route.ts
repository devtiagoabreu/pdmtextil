import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEquipes } from "@/lib/db/schema/crm-equipes"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(crmEquipes)
      .where(eq(crmEquipes.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Equipe não encontrada" }, { status: 404 })
    }

    const values: Record<string, any> = {}
    if (body.nome !== undefined) values.nome = body.nome
    if (body.regiaoId !== undefined) values.regiaoId = body.regiaoId
    if (body.responsavelId !== undefined) values.responsavelId = body.responsavelId
    if (body.ativo !== undefined) values.ativo = body.ativo

    const [atualizada] = await db
      .update(crmEquipes)
      .set(values)
      .where(eq(crmEquipes.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Equipe #${id} atualizada`,
      entidade: "CrmEquipe",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/equipes/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.session.user.role !== "ADMIN" && auth.session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    await db.delete(crmEquipes).where(eq(crmEquipes.id, parseInt(id)))

    await notificarDelecao("Equipe CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/equipes/[id]")
  }
}
