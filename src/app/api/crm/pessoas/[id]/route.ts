import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { crmTarefas } from "@/lib/db/schema/crm-tarefas"
import { crmTimelineEventos } from "@/lib/db/schema/crm-timeline-eventos"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmVisitasLocalizacoes } from "@/lib/db/schema/crm-visitas-localizacoes"
import { crmPesquisasSatisfacao } from "@/lib/db/schema/crm-pesquisas-satisfacao"
import { crmPesquisasRespostas } from "@/lib/db/schema/crm-pesquisas-respostas"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { pessoasRepresentantes } from "@/lib/db/schema/pessoas-representantes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, and, ne, or, inArray } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
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
    if (body.telefone !== undefined) values.telefone = body.telefone || null
    if (body.celular !== undefined) values.celular = body.celular || null
    if (body.email !== undefined) values.email = body.email || null
    if (body.emailNf !== undefined) values.emailNf = body.emailNf || null
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

    if (body.status === "CONVERTIDO_CLIENTE" && existente.status !== "CONVERTIDO_CLIENTE" && atualizada.cnpj) {
      try {
        if (!atualizada.clienteId) {
          const [existenteCliente] = await db
            .select()
            .from(clientes)
            .where(eq(clientes.cnpj, atualizada.cnpj))
            .limit(1)

          if (existenteCliente) {
            await db.update(crmPessoas)
              .set({ clienteId: existenteCliente.id })
              .where(eq(crmPessoas.id, atualizada.id))
            atualizada.clienteId = existenteCliente.id
          } else {
            const [novoCliente] = await db.insert(clientes).values({
              nome: atualizada.nomeFantasia || atualizada.razaoSocial || "",
              cnpj: atualizada.cnpj,
              razaoSocial: atualizada.razaoSocial || "",
              endereco: atualizada.endereco || null,
              cidade: atualizada.cidade || null,
              uf: atualizada.uf || null,
            }).returning()
            await db.update(crmPessoas)
              .set({ clienteId: novoCliente.id })
              .where(eq(crmPessoas.id, atualizada.id))
            atualizada.clienteId = novoCliente.id
          }
        }
      } catch (err) {
        console.error("[sync-cliente]", err)
      }
    }

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Pessoa atualizada: ${nomePessoa}`,
      entidade: "CrmPessoa",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    await notificar("PESSOA_ATUALIZADA", `Pessoa atualizada: ${nomePessoa}`, `/comercial/crm/pessoas/${atualizada.id}`, session.user.name)

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
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    const empresaId = parseInt(id)

    await db.transaction(async (tx: any) => {
      const contatosIds = (await tx
        .select({ id: crmContatos.id })
        .from(crmContatos)
        .where(eq(crmContatos.empresaId, empresaId))).map((r: any) => r.id)

      const leadsIds = (await tx
        .select({ id: crmLeads.id })
        .from(crmLeads)
        .where(eq(crmLeads.pessoaId, empresaId))).map((r: any) => r.id)

      const oportunidadesIds = (await tx
        .select({ id: crmOportunidades.id })
        .from(crmOportunidades)
        .where(or(
          eq(crmOportunidades.empresaId, empresaId),
          leadsIds.length ? inArray(crmOportunidades.leadId, leadsIds) : undefined,
          contatosIds.length ? inArray(crmOportunidades.contatoId, contatosIds) : undefined,
        ))).map((r: any) => r.id)

      const visitasIds = (await tx
        .select({ id: crmVisitas.id })
        .from(crmVisitas)
        .where(or(
          eq(crmVisitas.empresaId, empresaId),
          oportunidadesIds.length ? inArray(crmVisitas.oportunidadeId, oportunidadesIds) : undefined,
          contatosIds.length ? inArray(crmVisitas.contatoId, contatosIds) : undefined,
        ))).map((r: any) => r.id)

      if (visitasIds.length) {
        const pesquisasIds = (await tx
          .select({ id: crmPesquisasSatisfacao.id })
          .from(crmPesquisasSatisfacao)
          .where(inArray(crmPesquisasSatisfacao.visitaId, visitasIds))).map((r: any) => r.id)

        if (pesquisasIds.length) {
          await tx.delete(crmPesquisasRespostas).where(inArray(crmPesquisasRespostas.pesquisaId, pesquisasIds))
          await tx.delete(crmPesquisasSatisfacao).where(inArray(crmPesquisasSatisfacao.id, pesquisasIds))
        }

        await tx.delete(crmVisitasLocalizacoes).where(inArray(crmVisitasLocalizacoes.visitaId, visitasIds))
        await tx.delete(crmVisitas).where(inArray(crmVisitas.id, visitasIds))
      }

      if (oportunidadesIds.length) {
        await tx.delete(crmTarefas).where(or(
          eq(crmTarefas.empresaId, empresaId),
          inArray(crmTarefas.oportunidadeId, oportunidadesIds),
        ))
        await tx.delete(crmPropostas).where(or(
          eq(crmPropostas.empresaId, empresaId),
          inArray(crmPropostas.oportunidadeId, oportunidadesIds),
        ))
        await tx.delete(crmOportunidades).where(inArray(crmOportunidades.id, oportunidadesIds))
      } else {
        await tx.delete(crmTarefas).where(eq(crmTarefas.empresaId, empresaId))
        await tx.delete(crmPropostas).where(eq(crmPropostas.empresaId, empresaId))
      }

      if (leadsIds.length) {
        await tx.delete(crmLeads).where(inArray(crmLeads.id, leadsIds))
      }

      await tx.delete(crmWhatsappMensagens).where(or(
        eq(crmWhatsappMensagens.empresaId, empresaId),
        contatosIds.length ? inArray(crmWhatsappMensagens.contatoId, contatosIds) : undefined,
      ))
      await tx.delete(crmTimelineEventos).where(eq(crmTimelineEventos.empresaId, empresaId))

      if (contatosIds.length) {
        await tx.delete(crmContatos).where(inArray(crmContatos.id, contatosIds))
      }

      await tx.delete(pessoasRepresentantes).where(eq(pessoasRepresentantes.pessoaId, empresaId))
      await tx.delete(crmPessoas).where(eq(crmPessoas.id, empresaId))
    })

    await notificarDelecao("Pessoa CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/pessoas/[id]")
  }
}
