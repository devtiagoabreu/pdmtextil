import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmEmpresas } from "@/lib/db/schema/crm-empresas"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [oportunidade] = await db
      .select({
        id: crmOportunidades.id,
        titulo: crmOportunidades.titulo,
        descricao: crmOportunidades.descricao,
        valorEstimado: crmOportunidades.valorEstimado,
        status: crmOportunidades.status,
        leadId: crmOportunidades.leadId,
        empresaId: crmOportunidades.empresaId,
        empresaNome: crmEmpresas.razaoSocial,
        contatoId: crmOportunidades.contatoId,
        responsavelId: crmOportunidades.responsavelId,
        responsavelNome: usuarios.name,
        dataFechamentoPrevista: crmOportunidades.dataFechamentoPrevista,
        probabilidade: crmOportunidades.probabilidade,
        motivoPerda: crmOportunidades.motivoPerda,
        createdAt: crmOportunidades.createdAt,
        updatedAt: crmOportunidades.updatedAt,
      })
      .from(crmOportunidades)
      .leftJoin(crmEmpresas, eq(crmOportunidades.empresaId, crmEmpresas.id))
      .leftJoin(usuarios, eq(crmOportunidades.responsavelId, usuarios.id))
      .where(eq(crmOportunidades.id, parseInt(id)))
      .limit(1)

    if (!oportunidade) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 })
    }

    const contatos = oportunidade.contatoId ? await db
      .select()
      .from(crmContatos)
      .where(eq(crmContatos.id, oportunidade.contatoId))
      .limit(1) : []

    return NextResponse.json({ ...oportunidade, contato: contatos[0] || null })
  } catch (error) {
    return handleApiError(error, "GET /api/crm/oportunidades/[id]")
  }
}

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
      .from(crmOportunidades)
      .where(eq(crmOportunidades.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.titulo !== undefined) values.titulo = body.titulo
    if (body.descricao !== undefined) values.descricao = body.descricao || null
    if (body.valorEstimado !== undefined) values.valorEstimado = body.valorEstimado || null
    if (body.status !== undefined) values.status = body.status
    if (body.leadId !== undefined) values.leadId = body.leadId
    if (body.empresaId !== undefined) values.empresaId = body.empresaId
    if (body.contatoId !== undefined) values.contatoId = body.contatoId
    if (body.responsavelId !== undefined) values.responsavelId = body.responsavelId
    if (body.dataFechamentoPrevista !== undefined) values.dataFechamentoPrevista = body.dataFechamentoPrevista || null
    if (body.probabilidade !== undefined) values.probabilidade = body.probabilidade
    if (body.motivoPerda !== undefined) values.motivoPerda = body.motivoPerda || null

    const [atualizada] = await db
      .update(crmOportunidades)
      .set(values)
      .where(eq(crmOportunidades.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Oportunidade atualizada: ${atualizada.titulo}`,
      entidade: "CrmOportunidade",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/oportunidades/[id]")
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
    await db.delete(crmOportunidades).where(eq(crmOportunidades.id, parseInt(id)))

    await notificarDelecao("Oportunidade CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/oportunidades/[id]")
  }
}
