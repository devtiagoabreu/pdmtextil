import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { chats } from "@/lib/db/schema/chats"
import { eq, sql } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"
import { validateRequest, produtoCruSchema } from "@/lib/validation"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth
    const lista = await db
      .select({
        id: produtosCru.id,
        codigoPdm: produtosCru.codigoPdm,
        descricao: produtosCru.descricao,
        status: produtosCru.status,
        idIntegracaoErpCru: produtosCru.idIntegracaoErpCru,
        ativo: produtosCru.ativo,
        createdAt: produtosCru.createdAt,
        chatExists: sql<boolean>`coalesce((SELECT true FROM ${chats} WHERE ${chats.entidadeTipo} = 'PRODUTO_CRU' AND ${chats.entidadeId} = ${produtosCru.id} LIMIT 1), false)`,
      })
      .from(produtosCru)
      .orderBy(produtosCru.codigoPdm)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

    const body = await req.json()
    const parsed = validateRequest(produtoCruSchema, body)
    if ("error" in parsed) return parsed.error

    const novo = await db
      .insert(produtosCru)
      .values({
        codigoPdm: body.codigoPdm,
        descricao: body.descricao,
        solicitacaoDesenvolvimentoId: body.solicitacaoDesenvolvimentoId || null,
        status: body.status || "DESENVOLVIMENTO",
        fichaTecnica: body.fichaTecnica || null,
        links: body.links || [],
        ativo: body.ativo ?? true,
        idIntegracaoErpCru: body.idIntegracaoErpCru || null,
        idIntegracao: body.idIntegracao || null,
        criadoPor: userIdResult,
      })
      .returning()

    // Auto-altera solicitação vinculada para EM_DESENVOLVIMENTO
    if (body.solicitacaoDesenvolvimentoId) {
      const solId = Number(body.solicitacaoDesenvolvimentoId)
      if (!isNaN(solId)) {
        try {
          const [sol] = await db
            .select({ status: solicitacoes.status, historicoComunicacao: solicitacoes.historicoComunicacao })
            .from(solicitacoes)
            .where(eq(solicitacoes.id, solId))
            .limit(1)
          if (sol && sol.status === "PENDENTE") {
            const historico = (sol.historicoComunicacao as any[]) || []
            historico.push({
              data: new Date().toISOString(),
              usuario: session.user.name,
              acao: "MUDANCA_STATUS",
              de: sol.status,
              para: "EM_DESENVOLVIMENTO",
              mensagem: "Produto cru vinculado à solicitação",
            })
            await db
              .update(solicitacoes)
              .set({ status: "EM_DESENVOLVIMENTO", historicoComunicacao: historico, updatedAt: new Date() })
              .where(eq(solicitacoes.id, solId))
          }
        } catch (err) {
          console.error("[POST /api/cadastros/produto-cru] erro ao atualizar solicitação", err)
        }
      }
    }

    await notificar(
      "PRODUTO_CRU_CRIADO",
      `Novo produto cru #${novo[0].id} criado por ${session.user.name} — ${body.codigoPdm}: ${body.descricao}`,
      `/cadastros/produto-cru/${novo[0].id}`,
      session.user.name
    )

    await registrarLog({ tipo: "CADASTRO", acao: "criar", descricao: `Produto cru #${novo[0].id} criado - ${body.descricao}`, entidade: "ProdutoCru", entidadeId: novo[0].id, usuarioNome: session.user.name })

    return NextResponse.json(novo[0])
  } catch (error) {
    console.error("[POST /api/cadastros/produto-cru]", error)
    return NextResponse.json({ error: "Erro ao criar produto cru" }, { status: 500 })
  }
}
