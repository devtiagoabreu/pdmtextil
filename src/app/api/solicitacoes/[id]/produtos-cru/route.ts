import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const lista = await db
      .select()
      .from(produtosCru)
      .where(eq(produtosCru.solicitacaoDesenvolvimentoId, parseInt(id)))
      .orderBy(produtosCru.codigoPdm)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/solicitacoes/[id]/produtos-cru]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
