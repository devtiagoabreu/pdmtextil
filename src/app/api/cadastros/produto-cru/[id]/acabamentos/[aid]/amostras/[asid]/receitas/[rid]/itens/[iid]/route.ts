import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruReceitaItem as receitaItens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { validateItemChain } from "@/lib/validate-ownership"
export const dynamic = "force-dynamic"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string, iid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid, asid, rid, iid } = await params
    const err = await validateItemChain(parseInt(id), parseInt(aid), parseInt(asid), parseInt(rid), parseInt(iid))
    if (err) return err

    const body = await req.json()

    await db.update(receitaItens).set({
      quimicoId: body.quimicoId ?? null,
      descricao: body.descricao || null,
      unidade: body.unidade || "g/L",
      quantidadeMetro: body.quantidadeMetro,
      estagio: body.estagio || "A",
      ordem: body.ordem,
    }).where(eq(receitaItens.id, parseInt(iid)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT item]", error)
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string, iid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid, asid, rid, iid } = await params
    const err = await validateItemChain(parseInt(id), parseInt(aid), parseInt(asid), parseInt(rid), parseInt(iid))
    if (err) return err

    await db.delete(receitaItens).where(eq(receitaItens.id, parseInt(iid)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE item]", error)
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
