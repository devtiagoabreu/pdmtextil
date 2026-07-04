import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEmpresas } from "@/lib/db/schema/crm-empresas"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const empresa = await db
      .select({
        resumoIa: crmEmpresas.resumoIa,
        sugestaoIa: crmEmpresas.sugestaoIa,
        dataResumoIa: crmEmpresas.dataResumoIa,
      })
      .from(crmEmpresas)
      .where(eq(crmEmpresas.id, parseInt(params.id)))
      .then(rows => rows[0])

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("[GET /api/crm/ia/resumo-empresa]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { resumoIa, sugestaoIa } = body

    const [updated] = await db
      .update(crmEmpresas)
      .set({
        resumoIa: resumoIa || null,
        sugestaoIa: sugestaoIa || null,
        dataResumoIa: new Date(),
      })
      .where(eq(crmEmpresas.id, parseInt(params.id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[POST /api/crm/ia/resumo-empresa]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
