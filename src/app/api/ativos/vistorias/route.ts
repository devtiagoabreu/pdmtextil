import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosVistorias, ativos, ativosTiposVistoria } from "@/lib/db/schema/ativos"
import { procAreas } from "@/lib/db/schema/processos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, asc, and, lte, notInArray, type SQLWrapper } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = req.nextUrl
    const status = searchParams.get("status")
    const planoId = searchParams.get("planoId")
    const ativoId = searchParams.get("ativoId")
    const areaId = searchParams.get("areaId")
    const atrasadas = searchParams.get("atrasadas") === "true"

    const hoje = new Date().toISOString().slice(0, 10)

    const condicoes: SQLWrapper[] = []
    if (status) condicoes.push(eq(ativosVistorias.status, status))
    if (planoId) condicoes.push(eq(ativosVistorias.planoId, parseInt(planoId)))
    if (ativoId) condicoes.push(eq(ativosVistorias.ativoId, parseInt(ativoId)))
    if (areaId) condicoes.push(eq(ativosTiposVistoria.areaId, parseInt(areaId)))
    if (atrasadas) {
      condicoes.push(lte(ativosVistorias.dataProgramada, hoje))
      condicoes.push(notInArray(ativosVistorias.status, ["CONCLUIDA", "CANCELADA"]))
    }

    const lista = await db
      .select({
        id: ativosVistorias.id,
        planoId: ativosVistorias.planoId,
        ativoId: ativosVistorias.ativoId,
        ativoNome: ativos.nome,
        ativoCodigo: ativos.codigo,
        tipoVistoriaId: ativosVistorias.tipoVistoriaId,
        tipoVistoriaNome: ativosTiposVistoria.nome,
        periodicidade: ativosTiposVistoria.periodicidade,
        areaId: ativosTiposVistoria.areaId,
        areaNome: procAreas.nome,
        status: ativosVistorias.status,
        dataProgramada: ativosVistorias.dataProgramada,
        dataRealizada: ativosVistorias.dataRealizada,
        executadoPorId: ativosVistorias.executadoPorId,
        executadoPorNome: usuarios.name,
        resultado: ativosVistorias.resultado,
        checklistResposta: ativosVistorias.checklistResposta,
        observacoes: ativosVistorias.observacoes,
        custo: ativosVistorias.custo,
        anexos: ativosVistorias.anexos,
        createdById: ativosVistorias.createdById,
        createdAt: ativosVistorias.createdAt,
        updatedAt: ativosVistorias.updatedAt,
      })
      .from(ativosVistorias)
      .leftJoin(ativos, eq(ativosVistorias.ativoId, ativos.id))
      .leftJoin(ativosTiposVistoria, eq(ativosVistorias.tipoVistoriaId, ativosTiposVistoria.id))
      .leftJoin(procAreas, eq(ativosTiposVistoria.areaId, procAreas.id))
      .leftJoin(usuarios, eq(ativosVistorias.executadoPorId, usuarios.id))
      .where(condicoes.length > 0 ? and(...condicoes) : undefined)
      .orderBy(asc(ativosVistorias.dataProgramada))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/ativos/vistorias]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()

    if (!body.ativoId || !body.tipoVistoriaId) {
      return NextResponse.json(
        { error: "Ativo e tipo de vistoria são obrigatórios" },
        { status: 400 },
      )
    }

    const hoje = new Date().toISOString().slice(0, 10)

    const [nova] = await db
      .insert(ativosVistorias)
      .values({
        planoId: body.planoId ?? null,
        ativoId: body.ativoId,
        tipoVistoriaId: body.tipoVistoriaId,
        status: body.status || "PENDENTE",
        dataProgramada: body.dataProgramada || hoje,
        executadoPorId: body.executadoPorId ?? null,
        observacoes: body.observacoes ?? null,
        createdById: auth.userId,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Vistoria criada para o ativo #${nova.ativoId}`,
      entidade: "AtivoVistoria",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/ativos/vistorias")
  }
}