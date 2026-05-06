import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fios } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db
      .select()
      .from(fios)
      .orderBy(fios.nome)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/fios]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()

    const novoFio = await db
      .insert(fios)
      .values({
        codigoCompleto: body.codigoCompleto,
        codigoFio: body.codigoFio,
        nome: body.nome,
        nomeComercial: body.nomeComercial || null,
        composicao: body.composicao || null,
        titulo: body.titulo || null,
        torcao: body.torcao || null,
        resistencia: body.resistencia ? parseFloat(body.resistencia) : null,
        alongamento: body.alongamento ? parseFloat(body.alongamento) : null,
        fornecedor: body.fornecedor || null,
        observacoes: body.observacoes || null,
        ativo: body.ativo ?? true,
        criadoPor: parseInt(session.user.id),
      })
      .returning()

    return NextResponse.json(novoFio[0])
  } catch (error) {
    console.error("[POST /api/cadastros/fios]", error)
    return NextResponse.json({ error: "Erro ao criar fio" }, { status: 500 })
  }
}