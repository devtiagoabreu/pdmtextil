import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { receitas, receitaItens, produtosQuimicos } from "@/lib/db/schema"
import { eq, asc, desc } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { rid } = await params
    const itens = await db.select({
      id: receitaItens.id,
      receitaId: receitaItens.receitaId,
      quimicoId: receitaItens.quimicoId,
      descricao: receitaItens.descricao,
      unidade: receitaItens.unidade,
      quantidadeMetro: receitaItens.quantidadeMetro,
      estagio: receitaItens.estagio,
      ordem: receitaItens.ordem,
      createdAt: receitaItens.createdAt,
      quimicoNome: produtosQuimicos.nome,
      quimicoCodigo: produtosQuimicos.codigo,
    })
      .from(receitaItens)
      .leftJoin(produtosQuimicos, eq(receitaItens.quimicoId, produtosQuimicos.id))
      .where(eq(receitaItens.receitaId, parseInt(rid)))
      .orderBy(asc(receitaItens.ordem), asc(receitaItens.estagio))

    return NextResponse.json(itens)
  } catch (error) {
    console.error("[GET itens]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { rid } = await params
    const body = await req.json()

    const maxOrdem = await db.select({ max: receitaItens.ordem })
      .from(receitaItens)
      .where(eq(receitaItens.receitaId, parseInt(rid)))
      .limit(1)

    const [novo] = await db.insert(receitaItens).values({
      receitaId: parseInt(rid),
      quimicoId: body.quimicoId || null,
      descricao: body.descricao || null,
      unidade: body.unidade || "g/L",
      quantidadeMetro: body.quantidadeMetro,
      estagio: body.estagio || "A",
      ordem: (maxOrdem[0]?.max || 0) + 1,
    }).returning()

    return NextResponse.json(novo)
  } catch (error) {
    console.error("[POST itens]", error)
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 })
  }
}
