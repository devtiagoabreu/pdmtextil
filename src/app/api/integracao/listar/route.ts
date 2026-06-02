import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tela = searchParams.get("tela")

    const allIntegracoes = await db
      .select({
        id: integracoes.id,
        nome: integracoes.nome,
        baseUrl: integracoes.baseUrl,
        tipoAuth: integracoes.tipoAuth,
        telas: integracoes.telas,
      })
      .from(integracoes)
      .where(eq(integracoes.ativo, true))
      .orderBy(integracoes.nome)

    const filtered = tela
      ? allIntegracoes.filter((i) => {
          const telas = (i.telas as string[]) || []
          return telas.includes(tela)
        })
      : allIntegracoes

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("[GET /api/integracao/listar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
