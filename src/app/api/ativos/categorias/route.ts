import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativoCategorias } from "@/lib/db/schema/ativos"
import { procAreas } from "@/lib/db/schema/processos"
import { asc, eq } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoCategoriaSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: ativoCategorias.id,
        nome: ativoCategorias.nome,
        areaId: ativoCategorias.areaId,
        areaNome: procAreas.nome,
        descricao: ativoCategorias.descricao,
        cor: ativoCategorias.cor,
        icone: ativoCategorias.icone,
        ativo: ativoCategorias.ativo,
        createdAt: ativoCategorias.createdAt,
        updatedAt: ativoCategorias.updatedAt,
      })
      .from(ativoCategorias)
      .leftJoin(procAreas, eq(ativoCategorias.areaId, procAreas.id))
      .orderBy(asc(ativoCategorias.nome))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/ativos/categorias]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(ativoCategoriaSchema, body)
    if ("error" in parsed) return parsed.error

    const [nova] = await db
      .insert(ativoCategorias)
      .values({
        nome: parsed.data.nome,
        areaId: parsed.data.areaId,
        descricao: parsed.data.descricao || null,
        cor: parsed.data.cor || null,
        icone: parsed.data.icone || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Categoria criada: ${nova.nome}`,
      entidade: "AtivoCategoria",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar(
      "ATIVO_CATEGORIA_CRIADA",
      `Categoria cadastrada: ${nova.nome}`,
      `/ativos/categorias`,
      session.user.name
    )

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/ativos/categorias")
  }
}
