import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmSegmentos } from "@/lib/db/schema/crm-segmentos"
import { eq, desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: crmSegmentos.id,
        nome: crmSegmentos.nome,
        ativo: crmSegmentos.ativo,
        createdAt: crmSegmentos.createdAt,
        updatedAt: crmSegmentos.updatedAt,
      })
      .from(crmSegmentos)
      .orderBy(desc(crmSegmentos.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/segmentos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()

    if (!body.nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const [nova] = await db
      .insert(crmSegmentos)
      .values({
        nome: body.nome,
        ativo: body.ativo !== undefined ? body.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Segmento criado: ${body.nome}`,
      entidade: "CrmSegmento",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar("SEGMENTO_CRIADO", `Segmento criado: ${nova.nome}`, `/comercial/crm/segmentos`, session.user.name)

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/crm/segmentos")
  }
}
