import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string; asid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { aid, asid } = await params
    await db
      .delete(produtoCruAcabamentoAmostra)
      .where(
        and(
          eq(produtoCruAcabamentoAmostra.id, parseInt(asid)),
          eq(produtoCruAcabamentoAmostra.acabamentoId, parseInt(aid))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras/[asid]]", error)
    return NextResponse.json({ error: "Erro ao excluir amostra" }, { status: 500 })
  }
}
