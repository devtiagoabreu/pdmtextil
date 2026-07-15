import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmRegioes } from "@/lib/db/schema/crm-regioes"
import { eq } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
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
      .from(crmRegioes)
      .where(eq(crmRegioes.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Região não encontrada" }, { status: 404 })
    }

    const values: Record<string, any> = {}
    if (body.nome !== undefined) values.nome = body.nome
    if (body.uf !== undefined) values.uf = body.uf
    if (body.gerenteId !== undefined) values.gerenteId = body.gerenteId
    if (body.ativo !== undefined) values.ativo = body.ativo

    const [atualizada] = await db
      .update(crmRegioes)
      .set(values)
      .where(eq(crmRegioes.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Região #${id} atualizada`,
      entidade: "CrmRegiao",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    await notificar("REGIAO_ATUALIZADA", `Região #${id} atualizada`, `/comercial/crm/regioes/${atualizada.id}`, session.user.name)

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/regioes/[id]")
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
    await db.delete(crmRegioes).where(eq(crmRegioes.id, parseInt(id)))

    await notificarDelecao("Região CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/regioes/[id]")
  }
}
