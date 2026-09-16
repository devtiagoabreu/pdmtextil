import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativos, ativosReformas } from "@/lib/db/schema/ativos"
import { eq, asc } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoReformaSchema } from "@/lib/validation"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const lista = await db
      .select({
        id: ativosReformas.id,
        ativoId: ativosReformas.ativoId,
        data: ativosReformas.data,
        valor: ativosReformas.valor,
        extensaoVidaUtilAnos: ativosReformas.extensaoVidaUtilAnos,
        motivo: ativosReformas.motivo,
        descricao: ativosReformas.descricao,
        createdAt: ativosReformas.createdAt,
        updatedAt: ativosReformas.updatedAt,
      })
      .from(ativosReformas)
      .where(eq(ativosReformas.ativoId, parseInt(id)))
      .orderBy(asc(ativosReformas.data))

    return NextResponse.json(lista)
  } catch (error) {
    return handleApiError(error, "GET /api/ativos/[id]/reformas")
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(ativoReformaSchema, body)
    if ("error" in parsed) return parsed.error

    const ativoId = parseInt(id)
    const [ativo] = await db
      .select({ id: ativos.id, nome: ativos.nome })
      .from(ativos)
      .where(eq(ativos.id, ativoId))
      .limit(1)

    if (!ativo) {
      return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 })
    }

    const [nova] = await db
      .insert(ativosReformas)
      .values({
        ativoId,
        data: parsed.data.data,
        valor: parsed.data.valor ?? null,
        extensaoVidaUtilAnos: parsed.data.extensaoVidaUtilAnos ?? null,
        motivo: parsed.data.motivo ?? null,
        descricao: parsed.data.descricao ?? null,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Reforma registrada para o ativo #${ativoId}`,
      entidade: "AtivoReforma",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/ativos/[id]/reformas")
  }
}
