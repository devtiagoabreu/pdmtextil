import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { setupRedundancy } from "@/lib/db-admin"
import { resolverConnectionString } from "@/lib/db-admin/resolve-conn"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const {
      primaryBancoId,
      standbyBancoId,
      primaryConnString,
      standbyConnString,
      publicationName,
      subscriptionName,
      primaryDb,
      standbyDb,
    } = await req.json()
    const primaryResolvida = primaryBancoId
      ? await resolverConnectionString(Number(primaryBancoId))
      : (primaryConnString ?? null)
    const standbyResolvida = standbyBancoId
      ? await resolverConnectionString(Number(standbyBancoId))
      : (standbyConnString ?? null)
    if (!primaryResolvida || !standbyResolvida || !primaryDb || !standbyDb) {
      return NextResponse.json(
        {
          error:
            "primaryBancoId/standbyBancoId (ou connection strings), primaryDb e standbyDb são obrigatórios",
        },
        { status: 400 }
      )
    }

    const pubName = publicationName || `pub_${primaryDb}_${Date.now()}`
    const subName = subscriptionName || `sub_${standbyDb}_${Date.now()}`

    const result = await setupRedundancy(
      primaryResolvida,
      standbyResolvida,
      pubName,
      subName,
      primaryDb,
      standbyDb
    )
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/config/banco-dados/redundancia]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
