import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosTiposVistoria, ativoCategorias } from "@/lib/db/schema/ativos"
import { procAreas } from "@/lib/db/schema/processos"
import { eq, asc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoTipoVistoriaSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: ativosTiposVistoria.id,
        nome: ativosTiposVistoria.nome,
        categoriaId: ativosTiposVistoria.categoriaId,
        categoriaNome: ativoCategorias.nome,
        areaId: ativosTiposVistoria.areaId,
        areaNome: procAreas.nome,
        procedimento: ativosTiposVistoria.procedimento,
        checklist: ativosTiposVistoria.checklist,
        periodicidade: ativosTiposVistoria.periodicidade,
        diasIntervalo: ativosTiposVistoria.diasIntervalo,
        baseLegal: ativosTiposVistoria.baseLegal,
        ativo: ativosTiposVistoria.ativo,
        createdAt: ativosTiposVistoria.createdAt,
        updatedAt: ativosTiposVistoria.updatedAt,
      })
      .from(ativosTiposVistoria)
      .leftJoin(ativoCategorias, eq(ativosTiposVistoria.categoriaId, ativoCategorias.id))
      .leftJoin(procAreas, eq(ativosTiposVistoria.areaId, procAreas.id))
      .orderBy(asc(ativosTiposVistoria.nome))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/ativos/tipos-vistoria]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(ativoTipoVistoriaSchema, body)
    if ("error" in parsed) return parsed.error

    const [novo] = await db
      .insert(ativosTiposVistoria)
      .values({
        nome: parsed.data.nome,
        categoriaId: parsed.data.categoriaId || null,
        areaId: parsed.data.areaId,
        procedimento: parsed.data.procedimento || null,
        checklist: parsed.data.checklist,
        periodicidade: parsed.data.periodicidade,
        diasIntervalo: parsed.data.diasIntervalo || null,
        baseLegal: parsed.data.baseLegal || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Tipo de vistoria criado: ${novo.nome}`,
      entidade: "AtivoTipoVistoria",
      entidadeId: novo.id,
      usuarioNome: session.user.name,
    })

    await notificar(
      "ATIVO_TIPO_VISTORIA_CRIADA",
      `Tipo de vistoria cadastrado: ${novo.nome}`,
      `/ativos/tipos-vistoria/${novo.id}`,
      session.user.name
    )

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/ativos/tipos-vistoria")
  }
}
