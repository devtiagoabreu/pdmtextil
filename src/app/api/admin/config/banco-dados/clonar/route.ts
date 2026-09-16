import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cloneDatabase } from "@/lib/db-admin"
import { resolverConnectionString } from "@/lib/db-admin/resolve-conn"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { sourceBancoId, targetBancoId, sourceConnString, targetConnString, sourceDb, targetDb } =
      await req.json()
    const sourceResolvida = sourceBancoId
      ? await resolverConnectionString(Number(sourceBancoId))
      : (sourceConnString ?? null)
    const targetResolvida = targetBancoId
      ? await resolverConnectionString(Number(targetBancoId))
      : (targetConnString ?? null)
    if (!sourceResolvida || !targetResolvida || !sourceDb || !targetDb) {
      return NextResponse.json(
        {
          error:
            "sourceBancoId/targetBancoId (ou connection strings), sourceDb e targetDb são obrigatórios",
        },
        { status: 400 }
      )
    }

    const result = await cloneDatabase(sourceResolvida, targetResolvida, sourceDb, targetDb)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/config/banco-dados/clonar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
