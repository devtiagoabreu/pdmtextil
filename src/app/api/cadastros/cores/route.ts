import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { coresSolidas } from "@/lib/db/schema/cores"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db
      .select()
      .from(coresSolidas)
      .orderBy(coresSolidas.nome)

    return NextResponse.json(lista)
  } catch (error) {
    return handleApiError(error, "GET /api/cadastros/cores")
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()

    const novaCor = await db
      .insert(coresSolidas)
      .values({
        codigo: body.codigo,
        nome: body.nome,
        pantone: body.pantone || null,
        familia: body.familia || null,
        ativo: body.ativo ?? true,
        idIntegracao: body.idIntegracao || null,
      })
      .returning()

    return NextResponse.json(novaCor[0])
  } catch (error) {
    return handleApiError(error, "POST /api/cadastros/cores")
  }
}