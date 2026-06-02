import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruReceita as receitas, produtoCruReceitaItem as receitaItens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { validateReceitaChain } from "@/lib/validate-ownership"
export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid, asid, rid } = await params
    const err = await validateReceitaChain(parseInt(id), parseInt(aid), parseInt(asid), parseInt(rid))
    if (err) return err
    const receitaId = parseInt(rid)

    const [original] = await db.select().from(receitas).where(eq(receitas.id, receitaId)).limit(1)
    if (!original) return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 })

    const resultado = await db.transaction(async (tx) => {
      const originalId = original.receitaOriginalId || original.id

      const maxVersao = await tx.select({ max: receitas.versao })
        .from(receitas)
        .where(eq(receitas.receitaOriginalId, originalId))
        .limit(1)

      const ultimaVersao = maxVersao[0]?.max || 1

      const [nova] = await tx.insert(receitas).values({
        amostraId: parseInt(asid),
        descricao: original.descricao,
        instrucoes: original.instrucoes,
        versao: ultimaVersao + 1,
        receitaOriginalId: originalId,
      }).returning()

      const itensOriginais = await tx.select().from(receitaItens).where(eq(receitaItens.receitaId, receitaId))

      if (itensOriginais.length > 0) {
        await tx.insert(receitaItens).values(
          itensOriginais.map(item => ({
            receitaId: nova.id,
            quimicoId: item.quimicoId,
            descricao: item.descricao,
            unidade: item.unidade,
            quantidadeMetro: item.quantidadeMetro,
            estagio: item.estagio,
            ordem: item.ordem,
          }))
        )
      }

      return nova
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    console.error("[POST duplicar]", error)
    return NextResponse.json({ error: "Erro ao duplicar" }, { status: 500 })
  }
}
