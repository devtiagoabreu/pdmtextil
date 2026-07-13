import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, and, ne } from "drizzle-orm"
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
      .from(crmPessoas)
      .where(eq(crmPessoas.id, parseInt(id)))
      .limit(1)

    if (!empresa) {
      return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 })
    }

    const contatos = await db
      .select()
      .from(crmContatos)
      .where(eq(crmContatos.empresaId, empresa.id))

    return NextResponse.json({ ...empresa, contatos })
  } catch (error) {
    return handleApiError(error, "GET /api/crm/pessoas/[id]")
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
      .from(crmPessoas)
      .where(eq(crmPessoas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 })
    }

    const cnpj = body.cnpj ? body.cnpj.replace(/[^a-zA-Z0-9]/g, "") : undefined
    const cpf = body.cpf ? body.cpf.replace(/[^0-9]/g, "") : undefined

    if (cnpj) {
      const [duplicado] = await db
        .select({ id: crmPessoas.id })
        .from(crmPessoas)
        .where(and(eq(crmPessoas.cnpj, cnpj), ne(crmPessoas.id, parseInt(id))))
        .limit(1)
      if (duplicado) {
        return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
      }
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.tipoPessoa !== undefined) values.tipoPessoa = body.tipoPessoa
    if (body.nome !== undefined) values.nome = body.nome || null
    if (body.razaoSocial !== undefined) values.razaoSocial = body.razaoSocial || null
    if (body.nomeFantasia !== undefined) values.nomeFantasia = body.nomeFantasia || null
    if (body.cpf !== undefined) values.cpf = cpf || null
    if (body.cnpj !== undefined) values.cnpj = cnpj || null
    if (body.segmento !== undefined) values.segmento = body.segmento || null
    if (body.porte !== undefined) values.porte = body.porte || null
    if (body.site !== undefined) values.site = body.site || null
    if (body.endereco !== undefined) values.endereco = body.endereco || null
    if (body.numero !== undefined) values.numero = body.numero || null
    if (body.complemento !== undefined) values.complemento = body.complemento || null
    if (body.bairro !== undefined) values.bairro = body.bairro || null
    if (body.cidade !== undefined) values.cidade = body.cidade || null
    if (body.uf !== undefined) values.uf = body.uf || null
    if (body.cep !== undefined) values.cep = body.cep || null
    if (body.observacoes !== undefined) values.observacoes = body.observacoes || null
    if (body.status !== undefined) values.status = body.status
    if (body.responsavelId !== undefined) values.responsavelId = body.responsavelId
    if (body.ativo !== undefined) values.ativo = body.ativo

    const [atualizada] = await db
      .update(crmPessoas)
      .set(values)
      .where(eq(crmPessoas.id, parseInt(id)))
      .returning()

    const nomePessoa = atualizada.nome || atualizada.razaoSocial || "Pessoa"
    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Pessoa atualizada: ${nomePessoa}`,
      entidade: "CrmPessoa",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/pessoas/[id]")
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
    await db.delete(crmPessoas).where(eq(crmPessoas.id, empresaId))

    await notificarDelecao("Pessoa CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/pessoas/[id]")
  }
}
