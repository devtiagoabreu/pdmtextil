import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEquipes } from "@/lib/db/schema/crm-equipes"
import { crmRegioes } from "@/lib/db/schema/crm-regioes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const regiaoId = searchParams.get("regiaoId")

    const conditions = []
    if (regiaoId) conditions.push(eq(crmEquipes.regiaoId, parseInt(regiaoId)))

    const where = conditions.length > 0 ? conditions.reduce((a, b) => a && b) : undefined

    const lista = await db
      .select({
        id: crmEquipes.id,
        nome: crmEquipes.nome,
        regiaoId: crmEquipes.regiaoId,
        regiaoNome: crmRegioes.nome,
        responsavelId: crmEquipes.responsavelId,
        responsavelNome: usuarios.name,
        ativo: crmEquipes.ativo,
        createdAt: crmEquipes.createdAt,
      })
      .from(crmEquipes)
      .leftJoin(crmRegioes, eq(crmEquipes.regiaoId, crmRegioes.id))
      .leftJoin(usuarios, eq(crmEquipes.responsavelId, usuarios.id))
      .where(where)
      .orderBy(desc(crmEquipes.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/equipes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()

    const [nova] = await db
      .insert(crmEquipes)
      .values({
        nome: body.nome,
        regiaoId: body.regiaoId || null,
        responsavelId: body.responsavelId || null,
        ativo: body.ativo !== undefined ? body.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Equipe criada: ${body.nome}`,
      entidade: "CrmEquipe",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/equipes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
