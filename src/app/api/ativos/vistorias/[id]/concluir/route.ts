import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosVistorias } from "@/lib/db/schema/ativos"
import { eq, and } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { vistoriaConclusaoSchema } from "@/lib/validation"
import { avancarPlano } from "@/lib/ativos/agendamento"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(vistoriaConclusaoSchema, body)
    if ("error" in parsed) return parsed.error

    const [vistoria] = await db
      .select()
      .from(ativosVistorias)
      .where(eq(ativosVistorias.id, parseInt(id)))
      .limit(1)

    if (!vistoria) {
      return NextResponse.json({ error: "Vistoria não encontrada" }, { status: 404 })
    }

    const dataRealizada = parsed.data.dataRealizada || new Date().toISOString().slice(0, 10)

    if (vistoria.planoId != null && parsed.data.status !== "CANCELADA") {
      await avancarPlano(vistoria.planoId, dataRealizada)
    }

    const [atualizada] = await db
      .update(ativosVistorias)
      .set({
        status: parsed.data.status,
        dataRealizada,
        executadoPorId:
          parsed.data.executadoPorId !== undefined
            ? parsed.data.executadoPorId
            : vistoria.executadoPorId,
        resultado: parsed.data.resultado !== undefined ? parsed.data.resultado : vistoria.resultado,
        checklistResposta:
          parsed.data.checklistResposta !== undefined
            ? parsed.data.checklistResposta
            : vistoria.checklistResposta,
        observacoes:
          parsed.data.observacoes !== undefined ? parsed.data.observacoes : vistoria.observacoes,
        custo:
          parsed.data.custo === undefined
            ? vistoria.custo
            : parsed.data.custo === null
              ? null
              : String(parsed.data.custo),
        anexos: parsed.data.anexos !== undefined ? parsed.data.anexos : vistoria.anexos,
        updatedAt: new Date(),
      })
      .where(eq(ativosVistorias.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "concluir",
      descricao: `Vistoria #${vistoria.id} concluída com status ${parsed.data.status}`,
      entidade: "AtivoVistoria",
      entidadeId: vistoria.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "POST /api/ativos/vistorias/[id]/concluir")
  }
}
