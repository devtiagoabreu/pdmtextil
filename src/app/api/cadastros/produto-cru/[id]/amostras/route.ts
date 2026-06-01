import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAmostra } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth
    const id = parseInt((await params).id)
    const lista = await db.select().from(produtoCruAmostra).where(eq(produtoCruAmostra.produtoCruId, id))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru/[id]/amostras]", error)
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
    const session = auth.session
    const userIdResult = auth.userId

    const id = parseInt((await params).id)
    const body = await req.json()

    const novo = await db
      .insert(produtoCruAmostra)
      .values({
        produtoCruId: id,
        descricao: body.descricao,
        status: body.status || "PENDENTE",
        observacoes: body.observacoes || null,
        quantidadeProduzida: body.quantidadeProduzida || null,
        idIntegracaoErpCru: body.idIntegracaoErpCru || null,
        historico: [{
          data: new Date().toISOString(),
          usuario: session.user.name,
          usuarioId: userIdResult,
          acao: "CRIACAO",
          status: body.status || "PENDENTE",
        }],
      })
      .returning()

    await notificar(
      "AMOSTRA_CRIADA",
      `Nova amostra de tecido cru #${id} criada por ${session.user.name}${body.descricao ? ` — ${body.descricao}` : ""}`,
      `/cadastros/produto-cru/${id}`,
      session.user.name
    )

    await registrarLog({ tipo: "CADASTRO", acao: "criar", descricao: `Amostra de tecido cru #${novo[0].id} criada para produto #${id}`, entidade: "AmostraTecidoCru", entidadeId: novo[0].id, usuarioNome: session.user.name })

    return NextResponse.json(novo[0])
  } catch (error) {
    console.error("[POST /api/cadastros/produto-cru/[id]/amostras]", error)
    return NextResponse.json({ error: "Erro ao adicionar amostra" }, { status: 500 })
  }
}
