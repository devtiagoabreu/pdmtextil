import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { basesUrdume } from "@/lib/db/schema/bases-urdume"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db
      .select()
      .from(basesUrdume)
      .orderBy(basesUrdume.nome)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/bases-urdume]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()

    const novaBase = await db
      .insert(basesUrdume)
      .values({
        codigoCompleto: body.codigoCompleto,
        codigoBase: body.codigoBase,
        nome: body.nome,
        descricao: body.descricao || null,
        composicaoFios: body.composicaoFios || null,
        densidade: body.densidade || null,
        tratamentoEncolagem: body.tratamentoEncolagem || null,
        tensaoUrdume: body.tensaoUrdume || null,
        largura: body.largura || null,
        observacoes: body.observacoes || null,
        ativo: body.ativo ?? true,
        criadoPor: parseInt(session.user.id),
      })
      .returning()

    return NextResponse.json(novaBase[0])
  } catch (error) {
    console.error("[POST /api/cadastros/bases-urdume]", error)
    return NextResponse.json({ error: "Erro ao criar base de urdume" }, { status: 500 })
  }
}