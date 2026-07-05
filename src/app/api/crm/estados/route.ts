import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEstados } from "@/lib/db/schema/crm-estados"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      const [estado] = await db
        .select({
          id: crmEstados.id,
          nome: crmEstados.nome,
          uf: crmEstados.uf,
          regiao: crmEstados.regiao,
          gerenteId: crmEstados.gerenteId,
          gerenteNome: usuarios.name,
          createdAt: crmEstados.createdAt,
        })
        .from(crmEstados)
        .leftJoin(usuarios, eq(crmEstados.gerenteId, usuarios.id))
        .where(eq(crmEstados.id, Number(id)))
        .limit(1)
      return NextResponse.json(estado || null)
    }

    const lista = await db
      .select({
        id: crmEstados.id,
        nome: crmEstados.nome,
        uf: crmEstados.uf,
        regiao: crmEstados.regiao,
        gerenteId: crmEstados.gerenteId,
        gerenteNome: usuarios.name,
        createdAt: crmEstados.createdAt,
      })
      .from(crmEstados)
      .leftJoin(usuarios, eq(crmEstados.gerenteId, usuarios.id))
      .orderBy(crmEstados.nome)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/estados]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const uf = String(body.uf).toUpperCase().trim()
    const nome = String(body.nome).trim()

    if (!uf || uf.length !== 2) {
      return NextResponse.json({ error: "UF deve ter 2 caracteres" }, { status: 400 })
    }
    if (!nome) {
      return NextResponse.json({ error: "Nome do estado é obrigatório" }, { status: 400 })
    }

    const regiao = String(body.regiao || "").toUpperCase().trim() || null

    const [novo] = await db
      .insert(crmEstados)
      .values({ nome, uf, regiao })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Este estado/UF já existe" }, { status: 409 })
    }
    console.error("[POST /api/crm/estados]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    await db.delete(crmEstados).where(eq(crmEstados.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/estados]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
