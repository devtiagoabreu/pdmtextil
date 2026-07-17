import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { anexos } from "@/lib/db/schema/anexos"
import { chats } from "@/lib/db/schema/chats"
import { produtosCru, produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, and, sql } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"
import { validateRequest, solicitacaoSchema } from "@/lib/validation"
import { handleApiError } from "@/lib/api-error"

// GET - Listar solicitações (filtradas por perfil)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth
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
        observacoes: sql<string>`COALESCE(${solicitacoes.observacoes}, ${solicitacoes.briefing}->>'observacoes', '')`,
        createdAt: solicitacoes.createdAt,
        solicitanteId: solicitacoes.solicitanteId,
        solicitanteNome: usuarios.name,
        anexosCount: sql<number>`(SELECT count(*) FROM ${anexos} WHERE ${anexos.solicitacaoId} = ${solicitacoes.id})`,
        produtoId: sql<number | null>`(SELECT pc.id FROM ${produtosCru} pc WHERE pc.solicitacao_desenvolvimento_id = ${solicitacoes.id} LIMIT 1)`,
        produtoCodigoPdm: sql<string | null>`(SELECT pc.codigo_pdm FROM ${produtosCru} pc WHERE pc.solicitacao_desenvolvimento_id = ${solicitacoes.id} LIMIT 1)`,
        produtoIdIntegracao: sql<string | null>`(SELECT pc.id_integracao FROM ${produtosCru} pc WHERE pc.solicitacao_desenvolvimento_id = ${solicitacoes.id} LIMIT 1)`,
        produtoIdIntegracaoErpCru: sql<string | null>`(SELECT pc.id_integracao_erp_cru FROM ${produtosCru} pc WHERE pc.solicitacao_desenvolvimento_id = ${solicitacoes.id} LIMIT 1)`,
        produtoAmostrasCount: sql<number>`COALESCE((
          SELECT COUNT(*) FROM ${produtoCruAmostra} pca
          WHERE pca.produto_cru_id = (SELECT pc2.id FROM ${produtosCru} pc2 WHERE pc2.solicitacao_desenvolvimento_id = ${solicitacoes.id} LIMIT 1)
        ), 0) + COALESCE((
          SELECT COUNT(*) FROM ${produtoCruAcabamentoAmostra} pcaa
          WHERE pcaa.acabamento_id IN (
            SELECT pca2.id FROM ${produtoCruAcabamento} pca2 WHERE pca2.produto_cru_id = (SELECT pc3.id FROM ${produtosCru} pc3 WHERE pc3.solicitacao_desenvolvimento_id = ${solicitacoes.id} LIMIT 1)
          )
        ), 0)`,
        chatExists: sql<boolean>`coalesce((SELECT true FROM ${chats} WHERE ${chats.entidadeTipo} = 'SOLICITACAO' AND ${chats.entidadeId} = ${solicitacoes.id} LIMIT 1), false)`,
      })
      .from(solicitacoes)
      .leftJoin(usuarios, eq(solicitacoes.solicitanteId, usuarios.id))
      .where(where)
      .orderBy(desc(solicitacoes.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    return handleApiError(error, "GET /api/solicitacoes")
  }
}

// POST - Criar nova solicitação
export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  const session = (auth instanceof NextResponse) ? null : auth.session
  const userId = (auth instanceof NextResponse) ? null : auth.userId
  try {
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { anexos: anexosList, ...solicitacaoData } = body
    const parsed = validateRequest(solicitacaoSchema, solicitacaoData)
    if ("error" in parsed) return parsed.error
    const data = parsed.data

    // Sanitiza CNPJ: remove tudo que não for letra ou número
    const cnpj = data.cnpj ? data.cnpj.replace(/[^a-zA-Z0-9]/g, "") : null

    const historico = [
      {
        data: new Date().toISOString(),
        usuario: session.user.name,
        usuarioId: userId,
        acao: "CRIACAO",
        mensagem: "Solicitação criada pelo comercial",
      },
    ]

    const novaSolicitacao = await db.transaction(async (tx) => {
      const [solicitacao] = await tx
        .insert(solicitacoes)
        .values({
          tipo: data.tipo,
          cliente: data.cliente,
          cnpj: cnpj,
          projeto: data.projeto || null,
          prazoDesejado: data.prazoDesejado ? new Date(data.prazoDesejado) : null,
          briefing: data.briefing,
          solicitanteId: userId,
          status: "PENDENTE",
          historicoComunicacao: historico,
        })
        .returning()

      if (anexosList && anexosList.length > 0) {
        const links = (anexosList as any[]).filter((a) => a.tipo === "LINK")
        if (links.length > 0) {
          await tx.insert(anexos).values(
            links.map((a: any) => ({
              solicitacaoId: solicitacao.id,
              tipo: "LINK",
              titulo: a.nome || "Link externo",
              url: a.link,
              criadoPor: userId,
            }))
          )
        }
      }

      return solicitacao
    })

    await notificar(
      "SOLICITACAO_CRIADA",
      `Nova solicitação #${novaSolicitacao.id} criada por ${session.user.name} — ${data.cliente}${data.projeto ? ` (${data.projeto})` : ""}`,
      `/comercial/solicitacoes/${novaSolicitacao.id}`,
      session.user.name
    )

    await registrarLog({ tipo: "CADASTRO", acao: "criar", descricao: `Solicitação #${novaSolicitacao.id} criada - ${data.cliente}`, entidade: "Solicitacao", entidadeId: novaSolicitacao.id, usuarioNome: session.user.name })

    return NextResponse.json(novaSolicitacao, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/solicitacoes", session?.user?.name)
  }
}
