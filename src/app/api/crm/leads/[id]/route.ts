import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { eq } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [lead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, parseInt(id)))
      .limit(1)

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    return handleApiError(error, "GET /api/crm/leads/[id]")
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
      .from(crmLeads)
      .where(eq(crmLeads.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.nome !== undefined) values.nome = body.nome
    if (body.email !== undefined) values.email = body.email || null
    if (body.telefone !== undefined) values.telefone = body.telefone || null
    if (body.celular !== undefined) values.celular = body.celular || null
    if (body.empresaNome !== undefined) values.empresaNome = body.empresaNome || null
    if (body.cargo !== undefined) values.cargo = body.cargo || null
    if (body.origem !== undefined) values.origem = body.origem
    if (body.documento !== undefined) values.documento = body.documento || null
    if (body.status !== undefined) values.status = body.status
    if (body.descricao !== undefined) values.descricao = body.descricao || null
    if (body.responsavelId !== undefined) values.responsavelId = body.responsavelId
    if (body.empresaId !== undefined) values.empresaId = body.empresaId
    if (body.pessoaId !== undefined) values.pessoaId = body.pessoaId

    const [atualizado] = await db
      .update(crmLeads)
      .set(values)
      .where(eq(crmLeads.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Lead atualizado: ${atualizado.nome}`,
      entidade: "CrmLead",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    if (body.status && body.status !== existente.status && atualizado.empresaId) {
      await inserirTimelineEvento({
        empresaId: atualizado.empresaId,
        tipo: "LEAD",
        descricao: `Lead "${atualizado.nome}" mudou para "${body.status}"`,
        metadados: { leadId: atualizado.id, statusAnterior: existente.status, statusNovo: body.status },
      })
    }

    // Se mudou para CONVERTIDO, criar pessoa automaticamente (só se não veio pessoaId no body)
    if (body.status === "CONVERTIDO" && body.status !== existente.status && !body.pessoaId) {
      const pessoaData: Record<string, any> = {
        nome: atualizado.nome || existente.nome,
        email: atualizado.email || existente.email,
        telefone: atualizado.telefone || existente.telefone,
        celular: atualizado.celular || existente.celular,
        responsavelId: atualizado.responsavelId || existente.responsavelId,
        tipoPessoa: atualizado.tipoPessoa || existente.tipoPessoa || "PF",
      }

      const doc = atualizado.documento || existente.documento
      if (doc) {
        if (pessoaData.tipoPessoa === "PF") pessoaData.cpf = doc
        else pessoaData.cnpj = doc
      }

      if (atualizado.empresaNome || existente.empresaNome) {
        pessoaData.razaoSocial = atualizado.empresaNome || existente.empresaNome
      }

      const [pessoa] = await db.insert(crmPessoas).values(pessoaData).returning()

      // Vincular a pessoa criada ao lead
      await db.update(crmLeads).set({ pessoaId: pessoa.id, updatedAt: new Date() }).where(eq(crmLeads.id, atualizado.id))

      await inserirTimelineEvento({
        empresaId: atualizado.empresaId!,
        tipo: "LEAD",
        descricao: `Lead "${atualizado.nome}" convertido em pessoa (ID ${pessoa.id})`,
        metadados: { leadId: atualizado.id, pessoaId: pessoa.id },
      })
    }

    await notificar("LEAD_ATUALIZADO", `Lead atualizado: ${atualizado.nome}`, `/comercial/crm/leads/${atualizado.id}`, session.user.name)

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/leads/[id]")
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
    await db.delete(crmLeads).where(eq(crmLeads.id, parseInt(id)))

    await notificarDelecao("Lead CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/leads/[id]")
  }
}
