import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserId } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesCorte } from "@/lib/db/schema/requisicoes-corte"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"

// GET - Listar requisições de corte
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db
      .select({
        id: requisicoesCorte.id,
        requisitanteId: requisicoesCorte.requisitanteId,
        requisitanteNome: usuarios.name,
        codigoProduto: requisicoesCorte.codigoProduto,
        ordem: requisicoesCorte.ordem,
        artigo: requisicoesCorte.artigo,
        cor: requisicoesCorte.cor,
        desenho: requisicoesCorte.desenho,
        quantidade: requisicoesCorte.quantidade,
        status: requisicoesCorte.status,
        observacoes: requisicoesCorte.observacoes,
        entreguePor: requisicoesCorte.entreguePor,
        createdAt: requisicoesCorte.createdAt,
        updatedAt: requisicoesCorte.updatedAt,
      })
      .from(requisicoesCorte)
      .leftJoin(usuarios, eq(requisicoesCorte.requisitanteId, usuarios.id))
      .orderBy(desc(requisicoesCorte.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/comercial/requisicoes-corte]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova requisição de corte
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()

    const { codigoProduto, ordem, artigo, cor, desenho, quantidade, observacoes, entreguePor } = body

    if (!quantidade?.trim()) {
      return NextResponse.json({ error: "Quantidade é obrigatória" }, { status: 400 })
    }

    const userIdResult = getUserId(session)
    if (userIdResult instanceof NextResponse) return userIdResult
    const userId = userIdResult

    const [novaRequisicao] = await db
      .insert(requisicoesCorte)
      .values({
        requisitanteId: userId,
        codigoProduto: codigoProduto || null,
        ordem: ordem || null,
        artigo: artigo || null,
        cor: cor || null,
        desenho: desenho || null,
        quantidade,
        observacoes: observacoes || null,
        entreguePor: entreguePor || null,
        status: "SOLICITADO",
      })
      .returning()

    await notificar(
      "REQUISICAO_CORTE",
      `Nova requisição de corte #${novaRequisicao.id} criada por ${session.user.name}${artigo ? ` — ${artigo}` : ""}`,
      `/comercial/requisicoes-corte/${novaRequisicao.id}`,
      session.user.name
    )

    await registrarLog({ tipo: "CADASTRO", acao: "criar", descricao: `Requisição de corte #${novaRequisicao.id} criada`, entidade: "RequisicaoCorte", entidadeId: novaRequisicao.id, usuarioNome: session.user.name })

    return NextResponse.json(novaRequisicao, { status: 201 })
  } catch (error) {
    console.error("[POST /api/comercial/requisicoes-corte]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
