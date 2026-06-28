import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesAmostraComercial } from "@/lib/db/schema/requisicoes-amostra-comercial"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, ilike, or } from "drizzle-orm"
import { registrarLog } from "@/lib/log"
import { notificar } from "@/lib/notificar"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const url = new URL(req.url)
    const search = url.searchParams.get("search")

    let query = db
      .select({
        id: requisicoesAmostraComercial.id,
        status: requisicoesAmostraComercial.status,
        titulo: requisicoesAmostraComercial.titulo,
        cliente: requisicoesAmostraComercial.cliente,
        quantidade: requisicoesAmostraComercial.quantidade,
        produtoCodigo: produtosCru.codigoPdm,
        produtoDescricao: produtosCru.descricao,
        solicitanteNome: usuarios.name,
        createdAt: requisicoesAmostraComercial.createdAt,
        prazoDesejado: requisicoesAmostraComercial.prazoDesejado,
      })
      .from(requisicoesAmostraComercial)
      .innerJoin(produtosCru, eq(requisicoesAmostraComercial.produtoCruId, produtosCru.id))
      .leftJoin(usuarios, eq(requisicoesAmostraComercial.solicitanteId, usuarios.id))

    if (search) {
      query = query.where(
        or(
          ilike(requisicoesAmostraComercial.titulo, `%${search}%`),
          ilike(requisicoesAmostraComercial.cliente, `%${search}%`),
          ilike(produtosCru.codigoPdm, `%${search}%`),
          ilike(produtosCru.descricao, `%${search}%`),
        )
      )
    }

    const lista = await query.orderBy(desc(requisicoesAmostraComercial.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/requisicoes-amostra-comercial]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth

    const body = await req.json()
    const { cliente, produtoCruId, titulo, quantidade, motivo, observacoes, prazoDesejado, solicitacaoDesenvolvimentoId } = body

    const historico = [
      { data: new Date().toISOString(), usuario: session.user.name, acao: "CRIACAO" },
    ]

    const [result] = await db
      .insert(requisicoesAmostraComercial)
      .values({
        solicitanteId: parseInt(session.user.id),
        cliente: cliente || null,
        produtoCruId: parseInt(produtoCruId),
        titulo: titulo || null,
        quantidade: quantidade || null,
        motivo: motivo || null,
        observacoes: observacoes || null,
        prazoDesejado: prazoDesejado ? new Date(prazoDesejado) : null,
        solicitacaoDesenvolvimentoId: solicitacaoDesenvolvimentoId ? parseInt(solicitacaoDesenvolvimentoId) : null,
        historico,
      })
      .returning()

    await registrarLog({
      tipo: "CRIACAO",
      acao: "criar_requisicao_amostra_comercial",
      descricao: `Requisição de amostra comercial #${result.id} criada`,
      entidade: "RequisicaoAmostraComercial",
      entidadeId: result.id,
      usuarioNome: session.user.name,
    })

    await notificar(
      "AMOSTRA_COMERCIAL_CRIADA",
      `Nova requisição de amostra comercial #${result.id} criada por ${session.user.name}`,
      `/requisicoes-amostra-comercial/${result.id}`,
      session.user.name
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("[POST /api/requisicoes-amostra-comercial]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
