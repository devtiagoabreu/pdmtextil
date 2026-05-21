import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { anexos } from "@/lib/db/schema/anexos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, and, sql } from "drizzle-orm"
import { notificar } from "@/lib/notificar"

// GET - Listar solicitações (filtradas por perfil)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const tipo = searchParams.get("tipo")

    let conditions: any[] = []

    if (status) conditions.push(eq(solicitacoes.status, status))
    if (tipo) conditions.push(eq(solicitacoes.tipo, tipo))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const lista = await db
      .select({
        id: solicitacoes.id,
        tipo: solicitacoes.tipo,
        status: solicitacoes.status,
        cliente: solicitacoes.cliente,
        cnpj: solicitacoes.cnpj,
        projeto: solicitacoes.projeto,
        prazoDesejado: solicitacoes.prazoDesejado,
        createdAt: solicitacoes.createdAt,
        solicitanteId: solicitacoes.solicitanteId,
        solicitanteNome: usuarios.name,
        anexosCount: sql<number>`(SELECT count(*) FROM ${anexos} WHERE ${anexos.solicitacaoId} = ${solicitacoes.id})`,
      })
      .from(solicitacoes)
      .leftJoin(usuarios, eq(solicitacoes.solicitanteId, usuarios.id))
      .where(where)
      .orderBy(desc(solicitacoes.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/solicitacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova solicitação
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    console.log("=== POST /api/solicitacoes ===", JSON.stringify(body, null, 2))
    const { anexos: anexosList, ...solicitacaoData } = body

    // Validações básicas
    if (!solicitacaoData.cliente?.trim()) {
      return NextResponse.json({ error: "Cliente é obrigatório" }, { status: 400 })
    }
    if (!solicitacaoData.tipo) {
      return NextResponse.json({ error: "Tipo de solicitação é obrigatório" }, { status: 400 })
    }
    if (!solicitacaoData.briefing) {
      return NextResponse.json({ error: "Briefing é obrigatório" }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    const historico = [
      {
        data: new Date().toISOString(),
        usuario: session.user.name,
        usuarioId: userId,
        acao: "CRIACAO",
        mensagem: "Solicitação criada pelo comercial",
      },
    ]

    const [novaSolicitacao] = await db
      .insert(solicitacoes)
      .values({
        tipo: solicitacaoData.tipo,
        cliente: solicitacaoData.cliente,
        cnpj: solicitacaoData.cnpj || null,
        projeto: solicitacaoData.projeto || null,
        prazoDesejado: solicitacaoData.prazoDesejado ? new Date(solicitacaoData.prazoDesejado) : null,
        briefing: solicitacaoData.briefing,
        solicitanteId: userId,
        status: "PENDENTE",
        historicoComunicacao: historico,
      })
      .returning()

    // Inserir anexos (links por enquanto, arquivos serão adicionados no Bloco 1.6)
    if (anexosList && anexosList.length > 0) {
      const links = (anexosList as any[]).filter((a) => a.tipo === "LINK")
      if (links.length > 0) {
        await db.insert(anexos).values(
          links.map((a: any) => ({
            solicitacaoId: novaSolicitacao.id,
            tipo: "LINK",
            titulo: a.nome || "Link externo",
            url: a.link,
            criadoPor: userId,
          }))
        )
      }
    }

    notificar(
      "SOLICITACAO_CRIADA",
      `Nova solicitação #${novaSolicitacao.id} criada por ${session.user.name} — ${solicitacaoData.cliente}${solicitacaoData.projeto ? ` (${solicitacaoData.projeto})` : ""}`,
      `/comercial/solicitacoes/${novaSolicitacao.id}`,
      session.user.name
    )

    return NextResponse.json(novaSolicitacao, { status: 201 })
  } catch (error) {
    console.error("[POST /api/solicitacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
