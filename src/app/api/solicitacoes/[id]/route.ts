import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { anexos } from "@/lib/db/schema/anexos"
import { eq } from "drizzle-orm"
import { notificar, notificarDelecao, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
export const dynamic = "force-dynamic"

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
    // Sanitiza CNPJ: remove tudo que não for letra ou número
    const cnpj = body.cnpj ? body.cnpj.replace(/[^a-zA-Z0-9]/g, "") : null

    const resultado = await db
      .select()
      .from(solicitacoes)
      .where(eq(solicitacoes.id, parseInt(id)))
      .limit(1)

    if (!resultado[0]) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    const solicitacaoAntiga = resultado[0]
    const historicoAntigo: any[] = (solicitacaoAntiga.historicoComunicacao as any[]) || []
    
    const alteracoes: string[] = []
    if (body.cliente && body.cliente !== solicitacaoAntiga.cliente) {
      alteracoes.push(`Cliente: ${solicitacaoAntiga.cliente} → ${body.cliente}`)
    }
    if (body.projeto !== undefined && body.projeto !== solicitacaoAntiga.projeto) {
      alteracoes.push(`Projeto: ${solicitacaoAntiga.projeto || '-'} → ${body.projeto || '-'}`)
    }
    if (body.status && body.status !== solicitacaoAntiga.status) {
      alteracoes.push(`Status: ${solicitacaoAntiga.status} → ${body.status}`)
    }
    if (body.briefing && JSON.stringify(body.briefing) !== JSON.stringify(solicitacaoAntiga.briefing)) {
      alteracoes.push("Briefing atualizado")
    }
    if (body.prazoDesejado !== undefined) {
      const prazoAntigoStr = solicitacaoAntiga.prazoDesejado
        ? new Date(solicitacaoAntiga.prazoDesejado).toISOString().split("T")[0]
        : null
      const prazoNovoStr = body.prazoDesejado
        ? new Date(body.prazoDesejado).toISOString().split("T")[0]
        : null
      if (prazoAntigoStr !== prazoNovoStr) {
        alteracoes.push(`Prazo Desejado: ${prazoAntigoStr || '-'} → ${prazoNovoStr || '-'}`)
      }
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

    // Mapeamento explícito — NUNCA use spread do body diretamente no Drizzle.
    // Isso garante que cada campo seja tipado corretamente antes de ir ao banco.
    const setValues: Record<string, any> = {
      historicoComunicacao: novoHistorico,
      updatedAt: new Date(),
    }

    if (body.tipo !== undefined)     setValues.tipo     = body.tipo
    if (body.cliente !== undefined)  setValues.cliente  = body.cliente
    if (body.cnpj !== undefined)     setValues.cnpj     = cnpj
    if (body.projeto !== undefined)  setValues.projeto  = body.projeto || null
    if (body.status !== undefined) {
      setValues.status = body.status
      if (body.status === "CONCLUIDO") setValues.dataConclusao = new Date()
    }
    if (body.briefing !== undefined) setValues.briefing = body.briefing

    // Converte prazoDesejado: string ISO → Date para o Drizzle / Postgres timestamp
    if (body.prazoDesejado !== undefined) {
      setValues.prazoDesejado = body.prazoDesejado ? new Date(body.prazoDesejado) : null
    }

    const [solicitacaoAtualizada] = await db
      .update(solicitacoes)
      .set(setValues)
      .where(eq(solicitacoes.id, parseInt(id)))
      .returning()

    if (body.status && body.status !== solicitacaoAntiga.status && (body.status === "APROVADO" || body.status === "REPROVADO")) {
      await notificar(
        body.status === "APROVADO" ? "SOLICITACAO_APROVADA" : "SOLICITACAO_REPROVADA",
        `Solicitação #${id} foi ${body.status === "APROVADO" ? "aprovada" : "reprovada"} por ${session.user.name}${alteracoes.length > 0 ? ` — ${alteracoes[0]}` : ""}`,
        `/comercial/solicitacoes/${id}`,
        session.user.name
      )
    } else if (alteracoes.length > 0) {
      await notificar(
        "SOLICITACAO_ATUALIZADA",
        `Solicitação #${id} foi editada por ${session.user.name} — ${alteracoes[0]}${alteracoes.length > 1 ? ` e mais ${alteracoes.length - 1} alterações` : ""}`,
        `/comercial/solicitacoes/${id}`,
        session.user.name
      )
    }

    // Atualiza anexos: apaga os antigos e reinsere
    const { anexos: anexosList } = body
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

    await registrarLog({ tipo: "ATUALIZACAO", acao: "atualizar_status", descricao: `Solicitação #${id} alterada para ${body.status}`, entidade: "Solicitacao", entidadeId: parseInt(id), usuarioNome: session.user.name })

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
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role !== "ADMIN" && session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir solicitações" }, { status: 403 })
    }

    const { id } = await params
    const solicitacaoId = parseInt(id)

    await db
      .delete(anexos)
      .where(eq(anexos.solicitacaoId, solicitacaoId))

    await db
      .delete(solicitacoes)
      .where(eq(solicitacoes.id, solicitacaoId))

    await notificarDelecao("Solicitação", id, session?.user?.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/solicitacoes/[id]")
  }
}