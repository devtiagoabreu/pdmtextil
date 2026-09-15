import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosPlanosVistoria, ativosTiposVistoria } from "@/lib/db/schema/ativos"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoPlanoVistoriaSchema } from "@/lib/validation"
import { gerarOcorrencias } from "@/lib/ativos/agendamento"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select()
      .from(ativosPlanosVistoria)
      .where(eq(ativosPlanosVistoria.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Plano de vistoria não encontrado" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/ativos/planos/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(ativoPlanoVistoriaSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(ativosPlanosVistoria)
      .where(eq(ativosPlanosVistoria.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Plano de vistoria não encontrado" }, { status: 404 })
    }

    const proximaDataMudou =
      parsed.data.proximaData !== undefined && parsed.data.proximaData !== existente.proximaData
    const diasIntervaloMudou =
      parsed.data.diasIntervalo !== undefined && parsed.data.diasIntervalo !== existente.diasIntervalo

    const [atualizado] = await db
      .update(ativosPlanosVistoria)
      .set({
        ativoId: parsed.data.ativoId,
        tipoVistoriaId: parsed.data.tipoVistoriaId,
        responsavelId: parsed.data.responsavelId !== undefined ? parsed.data.responsavelId : existente.responsavelId,
        diasIntervalo: parsed.data.diasIntervalo !== undefined ? parsed.data.diasIntervalo : existente.diasIntervalo,
        proximaData: parsed.data.proximaData !== undefined ? parsed.data.proximaData : existente.proximaData,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(ativosPlanosVistoria.id, parseInt(id)))
      .returning()

    if (proximaDataMudou || diasIntervaloMudou) {
      const novaProximaData = atualizado.proximaData || new Date().toISOString().slice(0, 10)

      const [tipo] = await db
        .select()
        .from(ativosTiposVistoria)
        .where(eq(ativosTiposVistoria.id, atualizado.tipoVistoriaId))
        .limit(1)

      await gerarOcorrencias(atualizado.id, {
        proximaData: novaProximaData,
        periodicidade: tipo?.periodicidade ?? "MENSAL",
        diasIntervalo: atualizado.diasIntervalo ?? tipo?.diasIntervalo,
        ativoId: atualizado.ativoId,
        tipoVistoriaId: atualizado.tipoVistoriaId,
      })
    }

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Plano de vistoria #${id} atualizado`,
      entidade: "AtivoPlanoVistoria",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/ativos/planos/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    const [existente] = await db
      .select()
      .from(ativosPlanosVistoria)
      .where(eq(ativosPlanosVistoria.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Plano de vistoria não encontrado" }, { status: 404 })
    }

    await db.delete(ativosPlanosVistoria).where(eq(ativosPlanosVistoria.id, parseInt(id)))

    await notificarDelecao("Plano de vistoria", `Plano de vistoria #${existente.id}`, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/ativos/planos/[id]")
  }
}