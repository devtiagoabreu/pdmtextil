import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procSubprocessos, procProcessos } from "@/lib/db/schema/processos"
import { eq, desc, and } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procSubprocessoSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const processoId = req.nextUrl.searchParams.get("processoId")

    const base = db
      .select({
        id: procSubprocessos.id,
        processoId: procSubprocessos.processoId,
        processoNome: procProcessos.nome,
        nome: procSubprocessos.nome,
        descricao: procSubprocessos.descricao,
        ordem: procSubprocessos.ordem,
        ativo: procSubprocessos.ativo,
        createdAt: procSubprocessos.createdAt,
        updatedAt: procSubprocessos.updatedAt,
      })
      .from(procSubprocessos)
      .leftJoin(procProcessos, eq(procSubprocessos.processoId, procProcessos.id))

    const lista = processoId
      ? await base.where(and(eq(procSubprocessos.processoId, parseInt(processoId)), eq(procSubprocessos.ativo, true))).orderBy(procSubprocessos.ordem)
      : await base.orderBy(desc(procSubprocessos.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/processos/subprocessos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(procSubprocessoSchema, body)
    if ("error" in parsed) return parsed.error

    const [novo] = await db
      .insert(procSubprocessos)
      .values({
        processoId: parsed.data.processoId,
        nome: parsed.data.nome,
        descricao: parsed.data.descricao || null,
        ordem: parsed.data.ordem ?? 0,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Subprocesso criado: ${novo.nome}`,
      entidade: "ProcSubprocesso",
      entidadeId: novo.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_SUBPROCESSO_CRIADO", `Subprocesso cadastrado: ${novo.nome}`, `/processos/subprocessos/${novo.id}`, session.user.name)

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/processos/subprocessos")
  }
}