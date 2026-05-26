import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserId } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesCorte, requisicoesCorteItens } from "@/lib/db/schema"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db
      .select({
        id: requisicoesCorte.id,
        requisitanteId: requisicoesCorte.requisitanteId,
        requisitanteNome: usuarios.name,
        status: requisicoesCorte.status,
        observacoes: requisicoesCorte.observacoes,
        entreguePor: requisicoesCorte.entreguePor,
        createdAt: requisicoesCorte.createdAt,
        updatedAt: requisicoesCorte.updatedAt,
        totalCortes: sql<number>`COALESCE(COUNT(${requisicoesCorteItens.id}), 0)`,
        quantidadeTotal: sql<string>`COALESCE(CAST(SUM(NULLIF(REGEXP_REPLACE(COALESCE(${requisicoesCorteItens.quantidade},'0'), '[^0-9\\.]', '', 'g'), '')::numeric) AS text), '0')`,
      })
      .from(requisicoesCorte)
      .leftJoin(usuarios, eq(requisicoesCorte.requisitanteId, usuarios.id))
      .leftJoin(requisicoesCorteItens, eq(requisicoesCorteItens.requisicaoCorteId, requisicoesCorte.id))
      .groupBy(requisicoesCorte.id, usuarios.name)
      .orderBy(desc(requisicoesCorte.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/comercial/requisicoes-corte]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    const { itens, observacoes, entreguePor } = body

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: "Adicione pelo menos um item à requisição" }, { status: 400 })
    }

    const userIdResult = getUserId(session)
    if (userIdResult instanceof NextResponse) return userIdResult
    const userId = userIdResult

    const [novaRequisicao] = await db
      .insert(requisicoesCorte)
      .values({
        requisitanteId: userId,
        observacoes: observacoes || null,
        entreguePor: entreguePor || null,
        status: "SOLICITADO",
      })
      .returning()

    if (itens.length > 0) {
      await db.insert(requisicoesCorteItens).values(
        itens.map((item: any) => ({
          requisicaoCorteId: novaRequisicao.id,
          codigoProduto: item.codigoProduto || null,
          ordem: item.ordem || null,
          artigo: item.artigo || null,
          cor: item.cor || null,
          desenho: item.desenho || null,
          quantidade: item.quantidade,
        }))
      )
    }

    await notificar(
      "REQUISICAO_CORTE",
      `Nova requisição de corte #${novaRequisicao.id} criada por ${session.user.name} — ${itens.length} item(ns)`,
      `/comercial/requisicoes-corte/${novaRequisicao.id}`,
      session.user.name
    )

    await registrarLog({ tipo: "CADASTRO", acao: "criar", descricao: `Requisição de corte #${novaRequisicao.id} criada com ${itens.length} itens`, entidade: "RequisicaoCorte", entidadeId: novaRequisicao.id, usuarioNome: session.user.name })

    return NextResponse.json(novaRequisicao, { status: 201 })
  } catch (error) {
    console.error("[POST /api/comercial/requisicoes-corte]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
