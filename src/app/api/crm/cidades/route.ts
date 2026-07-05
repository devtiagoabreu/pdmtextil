import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmCidades } from "@/lib/db/schema/crm-cidades"
import { crmEstados } from "@/lib/db/schema/crm-estados"
import { eq, and, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const estadoId = searchParams.get("estadoId")
    const id = searchParams.get("id")

    if (id) {
      const [cidade] = await db
        .select({
          id: crmCidades.id,
          nome: crmCidades.nome,
          estadoId: crmCidades.estadoId,
          uf: crmEstados.uf,
          estadoNome: crmEstados.nome,
          createdAt: crmCidades.createdAt,
        })
        .from(crmCidades)
        .leftJoin(crmEstados, eq(crmCidades.estadoId, crmEstados.id))
        .where(eq(crmCidades.id, Number(id)))
        .limit(1)
      return NextResponse.json(cidade || null)
    }

    const query = db
      .select({
        id: crmCidades.id,
        nome: crmCidades.nome,
        estadoId: crmCidades.estadoId,
        uf: crmEstados.uf,
        estadoNome: crmEstados.nome,
        createdAt: crmCidades.createdAt,
      })
      .from(crmCidades)
      .leftJoin(crmEstados, eq(crmCidades.estadoId, crmEstados.id))
      .orderBy(crmCidades.nome)

    if (estadoId) {
      query.where(eq(crmCidades.estadoId, Number(estadoId)))
    }

    const lista = await query
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/cidades]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const nome = String(body.nome).trim()
    const estadoId = Number(body.estadoId)

    if (!nome) {
      return NextResponse.json({ error: "Nome da cidade é obrigatório" }, { status: 400 })
    }
    if (!estadoId) {
      return NextResponse.json({ error: "Estado é obrigatório" }, { status: 400 })
    }

    const [nova] = await db
      .insert(crmCidades)
      .values({ nome, estadoId })
      .returning()

    return NextResponse.json(nova, { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Esta cidade já existe neste estado" }, { status: 409 })
    }
    console.error("[POST /api/crm/cidades]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
