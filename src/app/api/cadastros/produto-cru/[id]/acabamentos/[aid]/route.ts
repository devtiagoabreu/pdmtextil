import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamento } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"
import { notificar } from "@/lib/notificar"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid } = await params

    notificar(
      "ACABAMENTO_EXCLUIDO",
      `Acabamento #${aid} do produto cru #${id} foi excluído por ${session.user.name}`,
      `/cadastros/produto-cru/${id}`,
      session.user.name
    )

    await db
      .delete(produtoCruAcabamento)
      .where(
        and(
          eq(produtoCruAcabamento.id, parseInt(aid)),
          eq(produtoCruAcabamento.produtoCruId, parseInt(id))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/acabamentos/[aid]]", error)
    return NextResponse.json({ error: "Erro ao excluir acabamento" }, { status: 500 })
  }
}
