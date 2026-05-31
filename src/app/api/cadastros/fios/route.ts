import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { fios } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"
import { validateRequest, fioSchema } from "@/lib/validation"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth

    console.log("[GET /api/cadastros/fios] Buscando fios...")

    const lista = await db
      .select()
      .from(fios)
      .orderBy(fios.nome)

    console.log("[GET /api/cadastros/fios] Encontrados:", lista.length)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/fios]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

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
    console.error("[POST /api/cadastros/fios]", error)
    const message = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: "Erro ao criar fio: " + message }, { status: 500 })
  }
}