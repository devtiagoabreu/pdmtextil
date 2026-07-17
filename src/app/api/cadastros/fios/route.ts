import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { fios } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"
import { validateRequest, fioSchema } from "@/lib/validation"
import { handleApiError } from "@/lib/api-error"
import { getPaginationParams, cursorCondition, buildPaginatedResponse } from "@/lib/pagination"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth

    const { cursor, limit } = getPaginationParams(req)

    const rows = await db
      .select()
      .from(fios)
      .where(cursorCondition(fios, cursor))
      .orderBy(fios.nome)
      .limit(limit + 1)

    return NextResponse.json(rows)
  } catch (error) {
    return handleApiError(error, "GET /api/cadastros/fios")
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  const session = (auth instanceof NextResponse) ? null : auth.session
  const userIdResult = (auth instanceof NextResponse) ? null : auth.userId
  try {
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const parsed = validateRequest(fioSchema, body)
    if ("error" in parsed) return parsed.error

    const novoFio = await db
      .insert(fios)
      .values({
        codigoCompleto: body.codigoCompleto,
        codigoFio: body.codigoFio,
        nome: body.nome,
        nomeComercial: body.nomeComercial || null,
        composicao: body.composicao || null,
        titulo: body.titulo || null,
        titulagemReal: body.titulagemReal || null,
        ncm: body.ncm || null,
        torcao: body.torcao || null,
        resistencia: body.resistencia || null,
        alongamento: body.alongamento || null,
        links: body.links || null,
        observacoes: body.observacoes || null,
        ativo: body.ativo === true,
        idIntegracao: body.idIntegracao || null,
        criadoPor: userIdResult,
      })
      .returning()

    return NextResponse.json(novoFio[0])
  } catch (error) {
    return handleApiError(error, "POST /api/cadastros/fios", session?.user?.name)
  }
}