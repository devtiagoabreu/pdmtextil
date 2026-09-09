import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procDiagramas } from "@/lib/db/schema/processos"
import { desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest, procDiagramaSchema } from "@/lib/validation"
import { modeloParaMermaid, mermaidParaModelo } from "@/lib/processos/diagrama/mermaid"
import { modeloParaMarkdown } from "@/lib/processos/diagrama/markdown"

interface CorpoDiagrama {
  nome: string
  tipo?: string
  descricao?: string | null
  modelo?: unknown
  bpmnXml?: string | null
  canvas?: unknown
  mermaid?: string | null
  markdown?: string | null
  ativo?: boolean
}

function derivarRepresentacoes(body: CorpoDiagrama): {
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
      mermaid: modeloParaMermaid(modelo as never, body.tipo ?? "FLUXOGRAMA"),
      markdown: modeloParaMarkdown(modelo as never),
    }
  }
  if (body.mermaid) {
    const parse = mermaidParaModelo(body.mermaid)
    if (!parse.modelo) return { ok: false, erro: parse.erro ?? "Texto Mermaid inválido." }
    return { ok: true, modelo: parse.modelo, mermaid: body.mermaid, markdown: modeloParaMarkdown(parse.modelo) }
  }
  return { ok: true, modelo: null, mermaid: null, markdown: null }
}

async function salvarRespostas(
  body: CorpoDiagrama,
  extra: Partial<typeof procDiagramas.$inferInsert>
): Promise<{ ok: true } | { ok: false; texto: string }> {
  const derivadas = derivarRepresentacoes(body)
  if (!derivadas.ok) return { ok: false, texto: derivadas.erro ?? "Conteúdo inválido." }
  Object.assign(extra, {
    modelo: derivadas.modelo ?? null,
    mermaid: derivadas.mermaid ?? null,
    markdown: derivadas.markdown ?? null,
  })
  return { ok: true }
}

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: procDiagramas.id,
        nome: procDiagramas.nome,
        tipo: procDiagramas.tipo,
        descricao: procDiagramas.descricao,
        ativo: procDiagramas.ativo,
        createdAt: procDiagramas.createdAt,
        updatedAt: procDiagramas.updatedAt,
      })
      .from(procDiagramas)
      .orderBy(desc(procDiagramas.updatedAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/processos/diagramas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(procDiagramaSchema, body)
    if ("error" in parsed) return parsed.error

    const valores: Partial<typeof procDiagramas.$inferInsert> = {
      nome: parsed.data.nome,
      tipo: parsed.data.tipo ?? "FLUXOGRAMA",
      descricao: parsed.data.descricao || null,
      bpmnXml: parsed.data.bpmnXml || null,
      canvas: parsed.data.canvas ?? null,
      ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
    }

    const pronto = await salvarRespostas(parsed.data, valores)
    if (!pronto.ok) return NextResponse.json({ error: pronto.texto }, { status: 400 })

    const [nova] = await db.insert(procDiagramas).values(valores).returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Diagrama criado: ${nova.nome}`,
      entidade: "ProcDiagrama",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_DIAGRAMA_CRIADA", `Diagrama criado: ${nova.nome}`, `/processos/visual/${nova.id}`, session.user.name)

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/processos/diagramas")
  }
}