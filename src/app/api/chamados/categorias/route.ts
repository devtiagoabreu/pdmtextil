import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chamadoCategorias } from "@/lib/db/schema/chamados"
import { asc, eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { chamadoCategoriaSchema } from "@/lib/validation"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const somenteAtivas = req.nextUrl.searchParams.get("somenteAtivas") === "true"

    const lista = await db
      .select({
        id: chamadoCategorias.id,
        codigo: chamadoCategorias.codigo,
        nome: chamadoCategorias.nome,
        cor: chamadoCategorias.cor,
        ativo: chamadoCategorias.ativo,
        ordem: chamadoCategorias.ordem,
        createdAt: chamadoCategorias.createdAt,
        updatedAt: chamadoCategorias.updatedAt,
      })
      .from(chamadoCategorias)
      .where(somenteAtivas ? eq(chamadoCategorias.ativo, true) : undefined)
      .orderBy(asc(chamadoCategorias.ordem), asc(chamadoCategorias.nome))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/chamados/categorias]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(chamadoCategoriaSchema, body)
    if ("error" in parsed) return parsed.error

    const [nova] = await db
      .insert(chamadoCategorias)
      .values({
        codigo: parsed.data.codigo,
        nome: parsed.data.nome,
        cor: parsed.data.cor,
        ativo: parsed.data.ativo,
        ordem: parsed.data.ordem,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Categoria de chamado criada: ${nova.nome}`,
      entidade: "ChamadoCategoria",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/chamados/categorias")
  }
}
