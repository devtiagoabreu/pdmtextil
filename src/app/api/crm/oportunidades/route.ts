import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmEmpresas } from "@/lib/db/schema/crm-empresas"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, like, or, sql } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let conditions = []
    if (status) conditions.push(eq(crmOportunidades.status, status))
    if (search) {
      conditions.push(
        or(
          like(crmOportunidades.titulo, `%${search}%`),
          like(crmEmpresas.razaoSocial, `%${search}%`),
          like(crmEmpresas.nomeFantasia, `%${search}%`),
        )
      )
    }

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
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
      .where(where)
      .orderBy(desc(crmOportunidades.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/oportunidades]", error)
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
      .insert(crmOportunidades)
      .values({
        titulo: body.titulo,
        descricao: body.descricao || null,
        valorEstimado: body.valorEstimado || null,
        leadId: body.leadId || null,
        empresaId: body.empresaId || null,
        contatoId: body.contatoId || null,
        responsavelId: body.responsavelId || userId,
        dataFechamentoPrevista: body.dataFechamentoPrevista || null,
        probabilidade: body.probabilidade || 0,
        status: "NOVO",
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Oportunidade criada: ${nova.titulo}`,
      entidade: "CrmOportunidade",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    if (nova.empresaId) {
      await inserirTimelineEvento({
        empresaId: nova.empresaId,
        tipo: "OPORTUNIDADE",
        descricao: `Oportunidade "${nova.titulo}" criada`,
        metadados: { oportunidadeId: nova.id },
      })
    }

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/oportunidades]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
