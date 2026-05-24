import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserId } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db
      .select()
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
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const userIdResult = getUserId(session)
    if (userIdResult instanceof NextResponse) return userIdResult

    const body = await req.json()

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

    notificar(
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
