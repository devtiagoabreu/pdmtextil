import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesCorte, requisicoesCorteItens } from "@/lib/db/schema"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"
import { validateRequest, requisicaoCorteSchema } from "@/lib/validation"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth
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
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userId = auth.userId

    const body = await req.json()
    const parsed = validateRequest(requisicaoCorteSchema, body)
    if ("error" in parsed) return parsed.error
    const { itens, observacoes, entreguePor } = parsed.data

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
        itens.map((item) => ({
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
