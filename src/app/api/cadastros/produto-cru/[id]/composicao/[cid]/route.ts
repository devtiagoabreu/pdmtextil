import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruComposicao } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, cid } = await params
    await db
      .delete(produtoCruComposicao)
      .where(
        and(
          eq(produtoCruComposicao.id, parseInt(cid)),
          eq(produtoCruComposicao.produtoCruId, parseInt(id))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/composicao/[cid]]", error)
    return NextResponse.json({ error: "Erro ao excluir composição" }, { status: 500 })
  }
}
