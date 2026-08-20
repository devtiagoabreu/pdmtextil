import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesCorteItens } from "@/lib/db/schema"
import { sql, ilike, and, isNotNull } from "drizzle-orm"

const CAMPOS_PERMITIDOS: Record<string, any> = {
  codigoProduto: requisicoesCorteItens.codigoProduto,
  ordem: requisicoesCorteItens.ordem,
  artigo: requisicoesCorteItens.artigo,
  cor: requisicoesCorteItens.cor,
  desenho: requisicoesCorteItens.desenho,
}

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const campo = searchParams.get("campo") || ""
    const busca = searchParams.get("busca") || ""

    const coluna = CAMPOS_PERMITIDOS[campo]
    if (!coluna) {
      return NextResponse.json({ error: "Campo inválido" }, { status: 400 })
    }

    if (!busca || busca.trim().length < 1) {
      return NextResponse.json([])
    }

    const resultados = await db
      .selectDistinct({ valor: coluna })
      .from(requisicoesCorteItens)
      .where(and(ilike(coluna, `%${busca.trim()}%`), isNotNull(coluna)))
      .orderBy(coluna)
      .limit(8)

    return NextResponse.json(resultados.map((r: any) => r.valor).filter(Boolean))
  } catch (error) {
    console.error("[GET /api/comercial/requisicoes-corte/sugestoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
