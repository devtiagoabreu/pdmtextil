import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPaises } from "@/lib/db/schema/crm-paises"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select()
      .from(crmPaises)
      .orderBy(crmPaises.nome)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/paises]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const nome = String(body.nome || "").trim()
    const codigo = String(body.codigo || "").trim()

    if (!nome) {
      return NextResponse.json({ error: "Nome do país é obrigatório" }, { status: 400 })
    }
    if (!codigo) {
      return NextResponse.json({ error: "Código do país é obrigatório" }, { status: 400 })
    }

    const [novo] = await db
      .insert(crmPaises)
      .values({ nome, codigo })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/crm/paises]", error)
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

    await db.delete(crmPaises).where(eq(crmPaises.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/paises]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
