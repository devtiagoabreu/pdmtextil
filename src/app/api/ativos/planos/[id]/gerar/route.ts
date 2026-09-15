import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosPlanosVistoria, ativosTiposVistoria } from "@/lib/db/schema/ativos"
import { eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { gerarOcorrencias } from "@/lib/ativos/agendamento"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const [plano] = await db
      .select()
      .from(ativosPlanosVistoria)
      .where(eq(ativosPlanosVistoria.id, parseInt(id)))
      .limit(1)

    if (!plano) {
      return NextResponse.json({ error: "Plano de vistoria não encontrado" }, { status: 404 })
    }

    const [tipo] = await db
      .select()
      .from(ativosTiposVistoria)
      .where(eq(ativosTiposVistoria.id, plano.tipoVistoriaId))
      .limit(1)

    if (!tipo) {
      return NextResponse.json({ error: "Tipo de vistoria não encontrado" }, { status: 404 })
    }

    const proximaData = plano.proximaData || new Date().toISOString().slice(0, 10)

    const ocorrenciasCriadas = await gerarOcorrencias(plano.id, {
      proximaData,
      periodicidade: tipo.periodicidade,
      diasIntervalo: plano.diasIntervalo ?? tipo.diasIntervalo,
      ativoId: plano.ativoId,
      tipoVistoriaId: plano.tipoVistoriaId,
    })

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "gerar_ocorrencias",
      descricao: `Ocorrências geradas para o plano de vistoria #${plano.id}`,
      entidade: "AtivoPlanoVistoria",
      entidadeId: plano.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json({ ocorrenciasCriadas })
  } catch (error) {
    return handleApiError(error, "POST /api/ativos/planos/[id]/gerar")
  }
}