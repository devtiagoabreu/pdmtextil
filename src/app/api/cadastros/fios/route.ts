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
    const data = parsed.data

    const novoFio = await db
      .insert(fios)
      .values({
        codigoCompleto: data.codigoCompleto,
        codigoFio: data.codigoFio,
        nome: data.nome,
        nomeComercial: data.nomeComercial || null,
        composicao: data.composicao || null,
        titulo: data.titulo || null,
        titulagemReal: data.titulagemReal || null,
        ncm: data.ncm || null,
        torcao: data.torcao || null,
        resistencia: data.resistencia || null,
        alongamento: data.alongamento || null,
        links: data.links || null,
        observacoes: data.observacoes || null,
        ativo: data.ativo === true,
        idIntegracao: data.idIntegracao || null,
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