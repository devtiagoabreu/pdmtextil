import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
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
    if (status) conditions.push(eq(crmLeads.status, status))
    if (search) {
      conditions.push(
        or(
          like(crmLeads.nome, `%${search}%`),
          like(crmLeads.email, `%${search}%`),
          like(crmLeads.empresaNome, `%${search}%`),
        )
      )
    }

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select({
        id: crmLeads.id,
        nome: crmLeads.nome,
        email: crmLeads.email,
        telefone: crmLeads.telefone,
        celular: crmLeads.celular,
        empresaNome: crmLeads.empresaNome,
        cargo: crmLeads.cargo,
        tipoPessoa: crmLeads.tipoPessoa,
        origem: crmLeads.origem,
        status: crmLeads.status,
        descricao: crmLeads.descricao,
        score: crmLeads.score,
        segmentoIa: crmLeads.segmentoIa,
        porteIa: crmLeads.porteIa,
        dataClassificacaoIa: crmLeads.dataClassificacaoIa,
        responsavelId: crmLeads.responsavelId,
        responsavelNome: usuarios.name,
        empresaId: crmLeads.empresaId,
        empresaNomeFantasia: crmPessoas.nomeFantasia,
        empresaRazaoSocial: crmPessoas.razaoSocial,
        createdAt: crmLeads.createdAt,
        updatedAt: crmLeads.updatedAt,
      })
      .from(crmLeads)
      .leftJoin(usuarios, eq(crmLeads.responsavelId, usuarios.id))
      .leftJoin(crmPessoas, eq(crmLeads.empresaId, crmPessoas.id))
      .where(where)
      .orderBy(desc(crmLeads.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/leads]", error)
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

    const [novo] = await db
      .insert(crmLeads)
      .values({
        nome: body.nome,
        email: body.email || null,
        telefone: body.telefone || null,
        celular: body.celular || null,
        empresaNome: body.empresaNome || null,
        cargo: body.cargo || null,
        origem: body.origem || "OUTRO",
        descricao: body.descricao || null,
        responsavelId: body.responsavelId || userId,
        empresaId: body.empresaId || null,
        status: "NOVO",
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Lead criado: ${novo.nome}`,
      entidade: "CrmLead",
      entidadeId: novo.id,
      usuarioNome: session.user.name,
    })

    if (novo.empresaId) {
      await inserirTimelineEvento({
        empresaId: novo.empresaId,
        tipo: "LEAD",
        descricao: `Lead "${novo.nome}" foi vinculado a esta empresa`,
        metadados: { leadId: novo.id },
      })
    }

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/leads]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
