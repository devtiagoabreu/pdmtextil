import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { anexos } from "@/lib/db/schema/anexos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"

// GET - Detalhe de uma solicitação
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const [solicitacao] = await db
      .select({
        id: solicitacoes.id,
        tipo: solicitacoes.tipo,
        status: solicitacoes.status,
        cliente: solicitacoes.cliente,
        cnpj: solicitacoes.cnpj,
        projeto: solicitacoes.projeto,
        briefing: solicitacoes.briefing,
        historicoComunicacao: solicitacoes.historicoComunicacao,
        observacoes: solicitacoes.observacoes,
        prazoDesejado: solicitacoes.prazoDesejado,
        dataConclusao: solicitacoes.dataConclusao,
        createdAt: solicitacoes.createdAt,
        updatedAt: solicitacoes.updatedAt,
        solicitanteId: solicitacoes.solicitanteId,
        solicitanteNome: usuarios.name,
      })
      .from(solicitacoes)
      .leftJoin(usuarios, eq(solicitacoes.solicitanteId, usuarios.id))
      .where(eq(solicitacoes.id, id))
      .limit(1)

    if (!solicitacao) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    // Buscar anexos
    const listaAnexos = await db
      .select()
      .from(anexos)
      .where(eq(anexos.solicitacaoId, id))

    return NextResponse.json({ ...solicitacao, anexos: listaAnexos })
  } catch (error) {
    console.error("[GET /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH - Adicionar comentário ou atualizar observações
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await req.json()

    const [solicitacaoAtual] = await db
      .select({ historicoComunicacao: solicitacoes.historicoComunicacao })
      .from(solicitacoes)
      .where(eq(solicitacoes.id, id))
      .limit(1)

    if (!solicitacaoAtual) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    const historico = (solicitacaoAtual.historicoComunicacao as any[]) || []

    if (body.comentario) {
      historico.push({
        data: new Date().toISOString(),
        usuario: session.user.name,
        usuarioId: parseInt(session.user.id),
        acao: "COMENTARIO",
        mensagem: body.comentario,
      })
    }

    const [atualizada] = await db
      .update(solicitacoes)
      .set({
        historicoComunicacao: historico,
        observacoes: body.observacoes ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(solicitacoes.id, id))
      .returning()

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PATCH /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
