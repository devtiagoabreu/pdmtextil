import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procAreas, procSites } from "@/lib/db/schema/processos"
import { eq, desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procAreaSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: procAreas.id,
        siteId: procAreas.siteId,
        siteNome: procSites.nome,
        nome: procAreas.nome,
        descricao: procAreas.descricao,
        ativo: procAreas.ativo,
        createdAt: procAreas.createdAt,
        updatedAt: procAreas.updatedAt,
      })
      .from(procAreas)
      .leftJoin(procSites, eq(procAreas.siteId, procSites.id))
      .orderBy(desc(procAreas.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/processos/areas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(procAreaSchema, body)
    if ("error" in parsed) return parsed.error

    const [nova] = await db
      .insert(procAreas)
      .values({
        siteId: parsed.data.siteId,
        nome: parsed.data.nome,
        descricao: parsed.data.descricao || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Área criada: ${nova.nome}`,
      entidade: "ProcArea",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_AREA_CRIADA", `Área cadastrada: ${nova.nome}`, `/processos/areas/${nova.id}`, session.user.name)

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/processos/areas")
  }
}