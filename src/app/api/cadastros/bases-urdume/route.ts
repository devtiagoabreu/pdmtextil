import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { basesUrdume, baseUrdumeFios } from "@/lib/db/schema/bases-urdume"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth
    const lista = await db
      .select()
      .from(basesUrdume)
      .orderBy(basesUrdume.nome)

    return NextResponse.json(lista)
  } catch (error) {
    return handleApiError(error, "GET /api/cadastros/bases-urdume")
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  const session = (auth instanceof NextResponse) ? null : auth.session
  const userIdResult = (auth instanceof NextResponse) ? null : auth.userId
  try {
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    const novaBase = await db
      .insert(basesUrdume)
      .values({
        codigoCompleto: body.codigoCompleto,
        codigoBase: body.codigoBase,
        nome: body.nome,
        descricao: body.descricao || null,
        densidade: body.densidade || null,
        tratamento: body.tratamento || null,
        tensaoUrdume: body.tensaoUrdume || null,
        largura: body.largura || null,
        observacoes: body.observacoes || null,
        ativo: body.ativo ?? true,
        idIntegracao: body.idIntegracao || null,
        criadoPor: userIdResult,
      })
      .returning()

    const baseId = novaBase[0].id

    if (body.fiosLista && Array.isArray(body.fiosLista)) {
      for (const fio of body.fiosLista) {
        await db.insert(baseUrdumeFios).values({
          baseUrdumeId: baseId,
          fioId: fio.fioId,
        })
      }
    }

    return NextResponse.json(novaBase[0])
  } catch (error) {
    return handleApiError(error, "POST /api/cadastros/bases-urdume", session?.user?.name)
  }
}