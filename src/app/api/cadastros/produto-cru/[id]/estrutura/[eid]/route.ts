import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruEstrutura } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, eid } = await params
    await db
      .delete(produtoCruEstrutura)
      .where(
        and(
          eq(produtoCruEstrutura.id, parseInt(eid)),
          eq(produtoCruEstrutura.produtoCruId, parseInt(id))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/estrutura/[eid]]", error)
    return NextResponse.json({ error: "Erro ao excluir estrutura" }, { status: 500 })
  }
}
