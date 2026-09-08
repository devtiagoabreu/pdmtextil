import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procAtividades, procSubprocessos } from "@/lib/db/schema/processos"
import { eq, desc, asc, and } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procAtividadeSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const subprocessoId = req.nextUrl.searchParams.get("subprocessoId")
    const processoId = req.nextUrl.searchParams.get("processoId")

    const base = db
      .select({
        id: procAtividades.id,
        subprocessoId: procAtividades.subprocessoId,
        subprocessoNome: procSubprocessos.nome,
        nome: procAtividades.nome,
        tipo: procAtividades.tipo,
        responsavel: procAtividades.responsavel,
        ordem: procAtividades.ordem,
        observacoes: procAtividades.observacoes,
        ativo: procAtividades.ativo,
        createdAt: procAtividades.createdAt,
        updatedAt: procAtividades.updatedAt,
      })
      .from(procAtividades)
      .leftJoin(procSubprocessos, eq(procAtividades.subprocessoId, procSubprocessos.id))

    let lista
    if (subprocessoId) {
      lista = await base
        .where(and(eq(procAtividades.subprocessoId, parseInt(subprocessoId)), eq(procAtividades.ativo, true)))
        .orderBy(asc(procAtividades.ordem))
    } else if (processoId) {
      lista = await base
        .where(eq(procSubprocessos.processoId, parseInt(processoId)))
        .orderBy(asc(procSubprocessos.ordem), asc(procAtividades.ordem))
    } else {
      lista = await base.orderBy(desc(procAtividades.createdAt))
    }

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/processos/atividades]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(procAtividadeSchema, body)
    if ("error" in parsed) return parsed.error

    const [nova] = await db
      .insert(procAtividades)
      .values({
        subprocessoId: parsed.data.subprocessoId,
        nome: parsed.data.nome,
        tipo: parsed.data.tipo ?? "MANUAL",
        responsavel: parsed.data.responsavel || null,
        ordem: parsed.data.ordem ?? 0,
        observacoes: parsed.data.observacoes || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Atividade criada: ${nova.nome}`,
      entidade: "ProcAtividade",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_ATIVIDADE_CRIADA", `Atividade cadastrada: ${nova.nome}`, `/processos/atividades/${nova.id}`, session.user.name)

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/processos/atividades")
  }
}