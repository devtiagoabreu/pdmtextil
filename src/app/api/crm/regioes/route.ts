import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmRegioes } from "@/lib/db/schema/crm-regioes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: crmRegioes.id,
        nome: crmRegioes.nome,
        uf: crmRegioes.uf,
        gerenteId: crmRegioes.gerenteId,
        gerenteNome: usuarios.name,
        ativo: crmRegioes.ativo,
        createdAt: crmRegioes.createdAt,
      })
      .from(crmRegioes)
      .leftJoin(usuarios, eq(crmRegioes.gerenteId, usuarios.id))
      .orderBy(desc(crmRegioes.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/regioes]", error)
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
      .insert(crmRegioes)
      .values({
        nome: body.nome,
        uf: body.uf || null,
        gerenteId: body.gerenteId || null,
        ativo: body.ativo !== undefined ? body.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Região criada: ${body.nome}`,
      entidade: "CrmRegiao",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar("REGIAO_CRIADA", `Região criada: ${nova.nome}`, `/comercial/crm/regioes/${nova.id}`, session.user.name)

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/regioes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
