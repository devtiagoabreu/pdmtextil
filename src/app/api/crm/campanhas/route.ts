import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmCampanhas } from "@/lib/db/schema/crm-campanhas"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, like, or, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let conditions = []
    if (status) conditions.push(eq(crmCampanhas.status, status))
    if (search) conditions.push(like(crmCampanhas.nome, `%${search}%`))

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select({
        id: crmCampanhas.id,
        nome: crmCampanhas.nome,
        tipo: crmCampanhas.tipo,
        descricao: crmCampanhas.descricao,
        dataInicio: crmCampanhas.dataInicio,
        dataFim: crmCampanhas.dataFim,
        orcamento: crmCampanhas.orcamento,
        leadsGerados: crmCampanhas.leadsGerados,
        custoAquisicao: crmCampanhas.custoAquisicao,
        status: crmCampanhas.status,
        criadoPor: crmCampanhas.criadoPor,
        criadoPorNome: usuarios.name,
        createdAt: crmCampanhas.createdAt,
        updatedAt: crmCampanhas.updatedAt,
      })
      .from(crmCampanhas)
      .leftJoin(usuarios, eq(crmCampanhas.criadoPor, usuarios.id))
      .where(where)
      .orderBy(desc(crmCampanhas.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/campanhas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await req.json()

    const [nova] = await db
      .insert(crmCampanhas)
      .values({
        nome: body.nome,
        tipo: body.tipo || "WHATSAPP",
        descricao: body.descricao || null,
        dataInicio: body.dataInicio || null,
        dataFim: body.dataFim || null,
        orcamento: body.orcamento || null,
        leadsGerados: body.leadsGerados || 0,
        custoAquisicao: body.custoAquisicao || null,
        status: "ATIVA",
        criadoPor: userId,
      })
      .returning()

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/campanhas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
