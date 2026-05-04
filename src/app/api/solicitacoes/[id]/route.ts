import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { anexos } from "@/lib/db/schema/anexos"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const resultado = await db
      .select()
      .from(solicitacoes)
      .where(eq(solicitacoes.id, parseInt(id)))
      .limit(1)

    if (!resultado[0]) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    const solicitacao = resultado[0]
    const anexosResult = await db.select().from(anexos).where(eq(anexos.solicitacaoId, parseInt(id)))
    const data = {
      ...solicitacao,
      anexos: anexosResult,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const resultado = await db
      .select()
      .from(solicitacoes)
      .where(eq(solicitacoes.id, parseInt(id)))
      .limit(1)

    if (!resultado[0]) {
      return NextResponse.json({ error: "Solicitação não encontrado" }, { status: 404 })
    }

    const solicitacaoAntiga = resultado[0]
    const historicoAntigo: any[] = (solicitacaoAntiga.historicoComunicacao as any[]) || []
    
    const alteracoes: string[] = []
    if (body.cliente && body.cliente !== solicitacaoAntiga.cliente) {
      alteracoes.push(`Cliente: ${solicitacaoAntiga.cliente} → ${body.cliente}`)
    }
    if (body.projeto && body.projeto !== solicitacaoAntiga.projeto) {
      alteracoes.push(`Projeto: ${solicitacaoAntiga.projeto || '-'} → ${body.projeto}`)
    }
    if (body.status && body.status !== solicitacaoAntiga.status) {
      alteracoes.push(`Status: ${solicitacaoAntiga.status} → ${body.status}`)
    }
    if (body.briefing && JSON.stringify(body.briefing) !== JSON.stringify(solicitacaoAntiga.briefing)) {
      alteracoes.push("Briefing atualizado")
    }

    const novoHistorico = [
      ...historicoAntigo,
      {
        data: new Date().toISOString(),
        usuario: session.user?.name || "Usuário",
        acao: alteracoes.length > 0 ? "ALTERACAO" : "ATUALIZACAO",
        mensagens: alteracoes,
      }
    ]

    const { anexos: anexosList, ...updateData } = body

    if (updateData.prazoDesejado) {
      updateData.prazoDesejado = new Date(updateData.prazoDesejado)
    } else {
      updateData.prazoDesejado = null
    }

    const [solicitacaoAtualizada] = await db
      .update(solicitacoes)
      .set({
        ...updateData,
        historicoComunicacao: novoHistorico,
        updatedAt: new Date(),
      })
      .where(eq(solicitacoes.id, parseInt(id)))
      .returning()

    if (anexosList !== undefined) {
      await db.delete(anexos).where(eq(anexos.solicitacaoId, parseInt(id)))
      if (anexosList.length > 0) {
        const links = anexosList.filter((a: any) => a.tipo === "LINK")
        if (links.length > 0) {
          await db.insert(anexos).values(
            links.map((a: any) => ({
              solicitacaoId: parseInt(id),
              tipo: "LINK",
              titulo: a.nome || "Link",
              url: a.link || a.url,
              criadoPor: parseInt(session.user?.id || "0")
            }))
          )
        }
      }
    }

    return NextResponse.json(solicitacaoAtualizada)
  } catch (error: any) {
    console.error("[PUT /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db
      .delete(solicitacoes)
      .where(eq(solicitacoes.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}