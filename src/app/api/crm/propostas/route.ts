import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    const status = searchParams.get("status")
    const oportunidadeId = searchParams.get("oportunidadeId")

    const conditions = []
    if (empresaId) conditions.push(eq(crmPropostas.empresaId, parseInt(empresaId)))
    if (status) conditions.push(eq(crmPropostas.status, status))
    if (oportunidadeId) conditions.push(eq(crmPropostas.oportunidadeId, parseInt(oportunidadeId)))

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select({
        id: crmPropostas.id,
        titulo: crmPropostas.titulo,
        valor: crmPropostas.valor,
        status: crmPropostas.status,
        empresaId: crmPropostas.empresaId,
        empresaNome: crmPessoas.razaoSocial,
        oportunidadeId: crmPropostas.oportunidadeId,
        oportunidadeTitulo: crmOportunidades.titulo,
        descricao: crmPropostas.descricao,
        condicoesPagamento: crmPropostas.condicoesPagamento,
        prazoEntrega: crmPropostas.prazoEntrega,
        arquivoUrl: crmPropostas.arquivoUrl,
        dataEnvio: crmPropostas.dataEnvio,
        dataResposta: crmPropostas.dataResposta,
        criadoPorNome: usuarios.name,
        createdAt: crmPropostas.createdAt,
      })
      .from(crmPropostas)
      .leftJoin(crmPessoas, eq(crmPropostas.empresaId, crmPessoas.id))
      .leftJoin(crmOportunidades, eq(crmPropostas.oportunidadeId, crmOportunidades.id))
      .leftJoin(usuarios, eq(crmPropostas.criadoPor, usuarios.id))
      .where(where)
      .orderBy(desc(crmPropostas.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/propostas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userId = auth.userId

    const body = await req.json()

    const [nova] = await db
      .insert(crmPropostas)
      .values({
        empresaId: body.empresaId,
        oportunidadeId: body.oportunidadeId || null,
        titulo: body.titulo,
        valor: body.valor || null,
        descricao: body.descricao || null,
        condicoesPagamento: body.condicoesPagamento || null,
        prazoEntrega: body.prazoEntrega || null,
        arquivoUrl: body.arquivoUrl || null,
        status: "ENVIADA",
        dataEnvio: new Date(),
        criadoPor: userId,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Proposta criada: ${body.titulo}`,
      entidade: "CrmProposta",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await inserirTimelineEvento({
      empresaId: nova.empresaId,
      tipo: "PROPOSTA",
      descricao: `Proposta "${nova.titulo}" enviada${nova.valor ? ` — valor: R$ ${Number(nova.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}`,
      metadados: { propostaId: nova.id },
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/propostas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
