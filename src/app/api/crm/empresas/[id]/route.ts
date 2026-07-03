import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
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
    const [empresa] = await db
      .select()
      .from(crmEmpresas)
      .where(eq(crmEmpresas.id, parseInt(id)))
      .limit(1)

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    const contatos = await db
      .select()
      .from(crmContatos)
      .where(eq(crmContatos.empresaId, empresa.id))

    return NextResponse.json({ ...empresa, contatos })
  } catch (error) {
    return handleApiError(error, "GET /api/crm/empresas/[id]")
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
      .from(crmEmpresas)
      .where(eq(crmEmpresas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    const cnpj = body.cnpj ? body.cnpj.replace(/[^a-zA-Z0-9]/g, "") : undefined

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.razaoSocial !== undefined) values.razaoSocial = body.razaoSocial
    if (body.nomeFantasia !== undefined) values.nomeFantasia = body.nomeFantasia || null
    if (body.cnpj !== undefined) values.cnpj = cnpj
    if (body.segmento !== undefined) values.segmento = body.segmento || null
    if (body.porte !== undefined) values.porte = body.porte || null
    if (body.site !== undefined) values.site = body.site || null
    if (body.observacoes !== undefined) values.observacoes = body.observacoes || null
    if (body.status !== undefined) values.status = body.status
    if (body.responsavelId !== undefined) values.responsavelId = body.responsavelId
    if (body.ativo !== undefined) values.ativo = body.ativo

    const [atualizada] = await db
      .update(crmEmpresas)
      .set(values)
      .where(eq(crmEmpresas.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Empresa CRM atualizada: ${atualizada.razaoSocial}`,
      entidade: "CrmEmpresa",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/empresas/[id]")
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
    const empresaId = parseInt(id)

    await db.delete(crmContatos).where(eq(crmContatos.empresaId, empresaId))
    await db.delete(crmEmpresas).where(eq(crmEmpresas.id, empresaId))

    await notificarDelecao("Empresa CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/empresas/[id]")
  }
}
