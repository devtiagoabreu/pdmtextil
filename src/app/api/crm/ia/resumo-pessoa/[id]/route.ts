import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const empresa = await db
      .select({
        resumoIa: crmPessoas.resumoIa,
        sugestaoIa: crmPessoas.sugestaoIa,
        dataResumoIa: crmPessoas.dataResumoIa,
      })
      .from(crmPessoas)
      .where(eq(crmPessoas.id, parseInt(id)))
      .then(rows => rows[0])

    if (!empresa) {
      return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("[GET /api/crm/ia/resumo-pessoa]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { resumoIa, sugestaoIa } = body
    const { id } = await params

    const [updated] = await db
      .update(crmPessoas)
      .set({
        resumoIa: resumoIa || null,
        sugestaoIa: sugestaoIa || null,
        dataResumoIa: new Date(),
      })
      .where(eq(crmPessoas.id, parseInt(id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[POST /api/crm/ia/resumo-pessoa]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
