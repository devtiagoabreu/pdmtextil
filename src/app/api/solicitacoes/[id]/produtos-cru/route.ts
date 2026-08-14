import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq, inArray } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const solicId = parseInt(id)
    const body = await req.json()
    const produtos = Array.isArray(body.produtos)
      ? body.produtos.filter((p: unknown) => typeof p === "number")
      : []
    if (produtos.length === 0) {
      return NextResponse.json({ error: "Selecione ao menos um produto" }, { status: 400 })
    }

    const [sol] = await db
      .select({ status: solicitacoes.status, historicoComunicacao: solicitacoes.historicoComunicacao })
      .from(solicitacoes)
      .where(eq(solicitacoes.id, solicId))
      .limit(1)
    if (!sol) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    await db.transaction(async (tx: any) => {
      await tx
        .update(produtosCru)
        .set({ solicitacaoDesenvolvimentoId: solicId, updatedAt: new Date() })
        .where(inArray(produtosCru.id, produtos))

      if (sol.status === "PENDENTE") {
        const historico = (sol.historicoComunicacao as any[]) || []
        historico.push({
          data: new Date().toISOString(),
          usuario: auth.session.user.name,
          acao: "MUDANCA_STATUS",
          de: sol.status,
          para: "EM_DESENVOLVIMENTO",
          mensagem: "Produto(s) vinculado(s) à solicitação",
        })
        await tx
          .update(solicitacoes)
          .set({ status: "EM_DESENVOLVIMENTO", historicoComunicacao: historico, updatedAt: new Date() })
          .where(eq(solicitacoes.id, solicId))
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/solicitacoes/[id]/produtos-cru]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const solicId = parseInt(id)
    const body = await req.json()
    const produtos = Array.isArray(body.produtos)
      ? body.produtos.filter((p: unknown) => typeof p === "number")
      : []
    if (produtos.length === 0) {
      return NextResponse.json({ error: "Selecione ao menos um produto" }, { status: 400 })
    }

    await db
      .update(produtosCru)
      .set({ solicitacaoDesenvolvimentoId: null, updatedAt: new Date() })
      .where(inArray(produtosCru.id, produtos))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/solicitacoes/[id]/produtos-cru]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
