import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth
    const { id, aid } = await params

    const [acabamento] = await db
      .select()
      .from(produtoCruAcabamento)
      .where(eq(produtoCruAcabamento.id, parseInt(aid)))
      .limit(1)
    if (!acabamento || acabamento.produtoCruId !== parseInt(id)) {
      return NextResponse.json({ error: "Acabamento não encontrado neste produto" }, { status: 404 })
    }

    const lista = await db.select().from(produtoCruAcabamentoAmostra).where(eq(produtoCruAcabamentoAmostra.acabamentoId, parseInt(aid)))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

    const { id, aid } = await params

    const [acabamento] = await db
      .select()
      .from(produtoCruAcabamento)
      .where(eq(produtoCruAcabamento.id, parseInt(aid)))
      .limit(1)
    if (!acabamento || acabamento.produtoCruId !== parseInt(id)) {
      return NextResponse.json({ error: "Acabamento não encontrado neste produto" }, { status: 404 })
    }

    const body = await req.json()

    const novo = await db
      .insert(produtoCruAcabamentoAmostra)
      .values({
        acabamentoId: parseInt(aid),
        descricao: body.descricao,
        status: body.status || "PENDENTE",
        observacoes: body.observacoes || null,
        quantidadeProduzida: body.quantidadeProduzida || null,
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
      `Nova amostra de acabamento #${aid} do produto #${id} criada por ${session.user.name}${body.descricao ? ` — ${body.descricao}` : ""}`,
      `/cadastros/produto-cru/${id}?tab=amostras&amostraId=amostra-acab-${aid}-${novo[0].id}`,
      session.user.name
    )

    await registrarLog({ tipo: "CADASTRO", acao: "criar", descricao: `Amostra de acabamento #${novo[0].id} criada`, entidade: "AmostraAcabamento", entidadeId: novo[0].id, usuarioNome: session.user.name })

    return NextResponse.json(novo[0])
  } catch (error) {
    console.error("[POST /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras]", error)
    return NextResponse.json({ error: "Erro ao adicionar amostra" }, { status: 500 })
  }
}
