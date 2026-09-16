import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosPlanosVistoria, ativos, ativosTiposVistoria } from "@/lib/db/schema/ativos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoPlanoVistoriaSchema } from "@/lib/validation"
import { gerarOcorrencias } from "@/lib/ativos/agendamento"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: ativosPlanosVistoria.id,
        ativoId: ativosPlanosVistoria.ativoId,
        ativoNome: ativos.nome,
        ativoCodigo: ativos.codigo,
        tipoVistoriaId: ativosPlanosVistoria.tipoVistoriaId,
        tipoVistoriaNome: ativosTiposVistoria.nome,
        periodicidade: ativosTiposVistoria.periodicidade,
        responsavelId: ativosPlanosVistoria.responsavelId,
        responsavelNome: usuarios.name,
        diasIntervalo: ativosPlanosVistoria.diasIntervalo,
        proximaData: ativosPlanosVistoria.proximaData,
        ativo: ativosPlanosVistoria.ativo,
        createdAt: ativosPlanosVistoria.createdAt,
        updatedAt: ativosPlanosVistoria.updatedAt,
      })
      .from(ativosPlanosVistoria)
      .leftJoin(ativos, eq(ativosPlanosVistoria.ativoId, ativos.id))
      .leftJoin(
        ativosTiposVistoria,
        eq(ativosPlanosVistoria.tipoVistoriaId, ativosTiposVistoria.id)
      )
      .leftJoin(usuarios, eq(ativosPlanosVistoria.responsavelId, usuarios.id))
      .orderBy(desc(ativosPlanosVistoria.id))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/ativos/planos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(ativoPlanoVistoriaSchema, body)
    if ("error" in parsed) return parsed.error

    const hoje = new Date().toISOString().slice(0, 10)
    const proximaDataFinal = parsed.data.proximaData || hoje

    const [plano] = await db
      .insert(ativosPlanosVistoria)
      .values({
        ativoId: parsed.data.ativoId,
        tipoVistoriaId: parsed.data.tipoVistoriaId,
        responsavelId: parsed.data.responsavelId ?? null,
        diasIntervalo: parsed.data.diasIntervalo ?? null,
        proximaData: proximaDataFinal,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    const [tipo] = await db
      .select()
      .from(ativosTiposVistoria)
      .where(eq(ativosTiposVistoria.id, plano.tipoVistoriaId))
      .limit(1)

    const ocorrenciasCriadas = await gerarOcorrencias(plano.id, {
      proximaData: proximaDataFinal,
      periodicidade: tipo?.periodicidade ?? "MENSAL",
      diasIntervalo: plano.diasIntervalo ?? tipo?.diasIntervalo,
      ativoId: plano.ativoId,
      tipoVistoriaId: plano.tipoVistoriaId,
    })

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Plano de vistoria criado: ativo #${plano.ativoId}`,
      entidade: "AtivoPlanoVistoria",
      entidadeId: plano.id,
      usuarioNome: session.user.name,
    })

    await notificar(
      "ATIVO_PLANO_CRIADO",
      `Plano de vistoria criado para o ativo #${plano.ativoId}`,
      `/ativos/planos/${plano.id}`,
      session.user.name
    )

    return NextResponse.json({ ...plano, ocorrenciasCriadas }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/ativos/planos")
  }
}
