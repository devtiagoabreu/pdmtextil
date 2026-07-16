import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { eq, desc, like, sql } from "drizzle-orm"
import { notificar } from "@/lib/notificar"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    const search = searchParams.get("search")

    const conditions: any[] = []
    if (empresaId) {
      conditions.push(eq(crmContatos.empresaId, parseInt(empresaId)))
    }
    if (search) {
      conditions.push(
        sql`${crmContatos.nome} ILIKE ${`%${search}%`} OR ${crmContatos.email} ILIKE ${`%${search}%`} OR ${crmPessoas.razaoSocial} ILIKE ${`%${search}%`}`
      )
    }

    const query = db
      .select({
        id: crmContatos.id,
        nome: crmContatos.nome,
        cargo: crmContatos.cargo,
        email: crmContatos.email,
        telefone: crmContatos.telefone,
        celular: crmContatos.celular,
        whatsapp: crmContatos.whatsapp,
        principal: crmContatos.principal,
        observacoes: crmContatos.observacoes,
        empresaId: crmContatos.empresaId,
        empresaNome: crmPessoas.nome,
        empresaRazaoSocial: crmPessoas.razaoSocial,
        empresaNomeFantasia: crmPessoas.nomeFantasia,
        createdAt: crmContatos.createdAt,
        updatedAt: crmContatos.updatedAt,
      })
      .from(crmContatos)
      .leftJoin(crmPessoas, eq(crmContatos.empresaId, crmPessoas.id))
      .orderBy(desc(crmContatos.createdAt))

    const lista = conditions.length > 0
      ? await query.where(conditions.reduce((a, b) => sql`${a} AND ${b}`))
      : await query
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/contatos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()

    const [novo] = await db
      .insert(crmContatos)
      .values({
        nome: body.nome,
        cargo: body.cargo || null,
        email: body.email || null,
        telefone: body.telefone || null,
        celular: body.celular || null,
        whatsapp: body.whatsapp || null,
        principal: body.principal || false,
        observacoes: body.observacoes || null,
        empresaId: body.empresaId,
      })
      .returning()

    await notificar("CONTATO_CRIADO", `Contato criado: ${novo.nome}`, `/comercial/crm/pessoas/${novo.empresaId}`, session.user.name)

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/contatos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
