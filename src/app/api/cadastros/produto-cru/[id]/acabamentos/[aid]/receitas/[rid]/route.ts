import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamentoReceita } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string; rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { aid, rid } = await params
    await db
      .delete(produtoCruAcabamentoReceita)
      .where(
        and(
          eq(produtoCruAcabamentoReceita.id, parseInt(rid)),
          eq(produtoCruAcabamentoReceita.acabamentoId, parseInt(aid))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/acabamentos/[aid]/receitas/[rid]]", error)
    return NextResponse.json({ error: "Erro ao excluir receita" }, { status: 500 })
  }
}
