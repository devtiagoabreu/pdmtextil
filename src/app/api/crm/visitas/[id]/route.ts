import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { crmPesquisasSatisfacao } from "@/lib/db/schema/crm-pesquisas-satisfacao"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"
import { handleApiError } from "@/lib/api-error"
import { sendCrmEmail } from "@/lib/email"
import crypto from "crypto"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [visita] = await db
      .select({
        id: crmVisitas.id,
        empresaId: crmVisitas.empresaId,
        empresaNome: crmPessoas.razaoSocial,
        empresaEndereco: crmPessoas.endereco,
        empresaNumero: crmPessoas.numero,
        empresaComplemento: crmPessoas.complemento,
        empresaBairro: crmPessoas.bairro,
        empresaCidade: crmPessoas.cidade,
        empresaUf: crmPessoas.uf,
        empresaCep: crmPessoas.cep,
        clienteId: crmVisitas.clienteId,
        clienteNome: clientes.nome,
        clienteEndereco: clientes.endereco,
        clienteCidade: clientes.cidade,
        clienteUf: clientes.uf,
        oportunidadeId: crmVisitas.oportunidadeId,
        oportunidadeTitulo: crmOportunidades.titulo,
        contatoId: crmVisitas.contatoId,
        contatoNome: crmContatos.nome,
        dataVisita: crmVisitas.dataVisita,
        tipo: crmVisitas.tipo,
        status: crmVisitas.status,
        endereco: crmVisitas.endereco,
        numero: crmVisitas.numero,
        complemento: crmVisitas.complemento,
        bairro: crmVisitas.bairro,
        cidade: crmVisitas.cidade,
        uf: crmVisitas.uf,
        cep: crmVisitas.cep,
        motivoCancelamento: crmVisitas.motivoCancelamento,
        relato: crmVisitas.relato,
        fotos: crmVisitas.fotos,
        criadoPor: crmVisitas.criadoPor,
        criadoPorNome: usuarios.name,
        createdAt: crmVisitas.createdAt,
        updatedAt: crmVisitas.updatedAt,
      })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
      .leftJoin(crmOportunidades, eq(crmVisitas.oportunidadeId, crmOportunidades.id))
      .leftJoin(crmContatos, eq(crmVisitas.contatoId, crmContatos.id))
      .leftJoin(usuarios, eq(crmVisitas.criadoPor, usuarios.id))
      .where(eq(crmVisitas.id, parseInt(id)))
      .limit(1)

    if (!visita) {
      return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 })
    }

    return NextResponse.json(visita)
  } catch (error) {
    return handleApiError(error, "GET /api/crm/visitas/[id]")
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
      .from(crmVisitas)
      .where(eq(crmVisitas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.empresaId !== undefined) values.empresaId = body.empresaId
    if (body.clienteId !== undefined) values.clienteId = body.clienteId
    if (body.oportunidadeId !== undefined) values.oportunidadeId = body.oportunidadeId
    if (body.contatoId !== undefined) values.contatoId = body.contatoId
    if (body.dataVisita !== undefined) values.dataVisita = body.dataVisita
    if (body.tipo !== undefined) values.tipo = body.tipo
    if (body.status !== undefined) values.status = body.status
    if (body.motivoCancelamento !== undefined) values.motivoCancelamento = body.motivoCancelamento
    if (body.endereco !== undefined) values.endereco = body.endereco || null
    if (body.numero !== undefined) values.numero = body.numero || null
    if (body.complemento !== undefined) values.complemento = body.complemento || null
    if (body.bairro !== undefined) values.bairro = body.bairro || null
    if (body.cidade !== undefined) values.cidade = body.cidade || null
    if (body.uf !== undefined) values.uf = body.uf || null
    if (body.cep !== undefined) values.cep = body.cep || null
    if (body.relato !== undefined) values.relato = body.relato
    if (body.fotos !== undefined) values.fotos = body.fotos

    const [atualizada] = await db
      .update(crmVisitas)
      .set(values)
      .where(eq(crmVisitas.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Visita #${id} atualizada`,
      entidade: "CrmVisita",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    if (body.status && body.status !== existente.status) {
      await inserirTimelineEvento({
        empresaId: existente.empresaId,
        tipo: "VISITA",
        descricao: `Visita alterada para "${body.status}"${body.status === "REALIZADA" && body.relato ? " — relato registrado" : ""}${body.status === "CANCELADA" && body.motivoCancelamento ? ` — motivo: ${body.motivoCancelamento}` : ""}`,
        metadados: { visitaId: atualizada.id, statusAnterior: existente.status, statusNovo: body.status },
      })

      if (body.status === "REALIZADA") {
        enviarPesquisaSatisfacao(atualizada.id, existente.empresaId, existente.clienteId, atualizada.contatoId).catch(err =>
          console.error("[AUTO SURVEY] Erro ao enviar pesquisa:", err.message)
        )
      }
    }

    await notificar("VISITA_ATUALIZADA", `Visita #${id} ${body.status ? `alterada para ${body.status}` : "atualizada"}`, `/comercial/crm/visitas/${atualizada.id}`, session.user.name)

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/visitas/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (!["ADMIN", "SUDO", "COMERCIAL", "CRM"].includes(auth.session.user.role)) {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    await db.delete(crmVisitas).where(eq(crmVisitas.id, parseInt(id)))

    await notificarDelecao("Visita CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/visitas/[id]")
  }
}

async function enviarPesquisaSatisfacao(
  visitaId: number,
  empresaId: number | null,
  clienteId: number | null,
  contatoId: number | null
) {
  try {
    const destinatarios: string[] = []
    const nomes: string[] = []

    if (empresaId) {
      const [pessoa] = await db
        .select({ email: crmPessoas.email, nome: crmPessoas.razaoSocial, nomeFantasia: crmPessoas.nomeFantasia })
        .from(crmPessoas)
        .where(eq(crmPessoas.id, empresaId))
        .limit(1)
      if (pessoa?.email && pessoa.email.includes("@")) {
        destinatarios.push(pessoa.email)
        nomes.push(pessoa.nomeFantasia || pessoa.nome || "Cliente")
      }
    }

    if (clienteId) {
      const [cliente] = await db
        .select({ email: clientes.email, nome: clientes.nome })
        .from(clientes)
        .where(eq(clientes.id, clienteId))
        .limit(1)
      if (cliente?.email && cliente.email.includes("@")) {
        destinatarios.push(cliente.email)
        nomes.push(cliente.nome || "Cliente")
      }
    }

    if (contatoId) {
      const [contato] = await db
        .select({ email: crmContatos.email, nome: crmContatos.nome })
        .from(crmContatos)
        .where(eq(crmContatos.id, contatoId))
        .limit(1)
      if (contato?.email && contato.email.includes("@") && !destinatarios.includes(contato.email)) {
        destinatarios.push(contato.email)
        nomes.push(contato.nome || "Contato")
      }
    }

    if (destinatarios.length === 0) return

    const [visita] = await db
      .select({ dataVisita: crmVisitas.dataVisita })
      .from(crmVisitas)
      .where(eq(crmVisitas.id, visitaId))
      .limit(1)

    const token = crypto.randomBytes(32).toString("hex")
    const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/comercial/crm/pesquisa/${token}`

    await db.insert(crmPesquisasSatisfacao).values({
      visitaId,
      email: destinatarios[0],
      nome: nomes[0],
      token,
      enviadoEm: new Date(),
      status: "ENVIADO",
    })

    const dataVisitaFormatada = visita?.dataVisita
      ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")
      : "data recente"

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #073fb8; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Pesquisa de Satisfacao</h1>
          <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">PDM PRO TEXTIL</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 15px;">
            Olá ${nomes[0]},
          </p>
          <p style="font-size: 14px; color: #334155; margin: 0 0 15px;">
            Agradecemos pela visita realizada em ${dataVisitaFormatada}.
          </p>
          <p style="font-size: 14px; color: #334155; margin: 0 0 20px;">
            Sua opiniao e muito importante para nos! Por favor, responda nossa pesquisa de satisfacao.
          </p>
          <a href="${surveyUrl}" style="display: inline-block; background: #073fb8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;">
            Responder Pesquisa
          </a>
          <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0;">
            Se o botao nao funcionar, copie e cole o link no navegador:<br/>
            <a href="${surveyUrl}" style="color: #073fb8;">${surveyUrl}</a>
          </p>
        </div>
      </div>
    `

    await sendCrmEmail({
      to: destinatarios,
      subject: "Pesquisa de Satisfacao - PDM PRO TEXTIL",
      html,
    })
  } catch (err: any) {
    console.error("[AUTO SURVEY] Erro:", err.message)
  }
}
