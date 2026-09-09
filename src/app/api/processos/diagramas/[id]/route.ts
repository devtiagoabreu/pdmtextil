import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procDiagramas } from "@/lib/db/schema/processos"
import { eq } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest, procDiagramaSchema } from "@/lib/validation"
import { modeloParaMermaid, mermaidParaModelo } from "@/lib/processos/diagrama/mermaid"
import { modeloParaMarkdown } from "@/lib/processos/diagrama/markdown"

function derivarRepresentacoes(body: Record<string, unknown>): {
  ok: boolean
  erro?: string
  modelo?: unknown
  mermaid?: string | null
  markdown?: string | null
} {
  if (body.modelo && typeof body.modelo === "object") {
    const modelo = body.modelo
    return {
      ok: true,
      modelo,
      mermaid: modeloParaMermaid(modelo as never, typeof body.tipo === "string" ? body.tipo : "FLUXOGRAMA"),
      markdown: modeloParaMarkdown(modelo as never),
    }
  }
  if (typeof body.mermaid === "string" && body.mermaid) {
    const parse = mermaidParaModelo(body.mermaid)
    if (!parse.modelo) return { ok: false, erro: parse.erro ?? "Texto Mermaid inválido." }
    return { ok: true, modelo: parse.modelo, mermaid: body.mermaid, markdown: modeloParaMarkdown(parse.modelo) }
  }
  return { ok: true, modelo: null, mermaid: null, markdown: null }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select()
      .from(procDiagramas)
      .where(eq(procDiagramas.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Diagrama não encontrado" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/processos/diagramas/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(procDiagramaSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(procDiagramas)
      .where(eq(procDiagramas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Diagrama não encontrado" }, { status: 404 })
    }

    const derivadas = derivarRepresentacoes(parsed.data)
    if (!derivadas.ok) return NextResponse.json({ error: derivadas.erro }, { status: 400 })

    const [atualizada] = await db
      .update(procDiagramas)
      .set({
        nome: parsed.data.nome,
        tipo: parsed.data.tipo ?? existente.tipo,
        descricao: parsed.data.descricao || null,
        modelo: derivadas.modelo ?? null,
        bpmnXml: parsed.data.bpmnXml || null,
        canvas: parsed.data.canvas ?? null,
        mermaid: derivadas.mermaid ?? null,
        markdown: derivadas.markdown ?? null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(procDiagramas.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Diagrama #${id} atualizado`,
      entidade: "ProcDiagrama",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_DIAGRAMA_ATUALIZADA", `Diagrama atualizado: ${atualizada.nome}`, `/processos/visual/${atualizada.id}`, session.user.name)

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/processos/diagramas/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    const [existente] = await db
      .select()
      .from(procDiagramas)
      .where(eq(procDiagramas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Diagrama não encontrado" }, { status: 404 })
    }

    await db.delete(procDiagramas).where(eq(procDiagramas.id, parseInt(id)))

    await notificarDelecao("Diagrama", existente.nome, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/processos/diagramas/[id]")
  }
}