import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamentoReceita } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"
import { validateAcabamentoChain } from "@/lib/validate-ownership"
import { handleApiError } from "@/lib/api-error"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string; rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid, rid } = await params
    const err = await validateAcabamentoChain(parseInt(id), parseInt(aid))
    if (err) return err

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
    return handleApiError(error, "DELETE /api/cadastros/produto-cru/[id]/acabamentos/[aid]/receitas/[rid]")
  }
}
