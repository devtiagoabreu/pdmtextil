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

    const { sourceBancoId, targetBancoId, sourceDb, targetDb } = await req.json()
    if (!sourceBancoId || !targetBancoId || !sourceDb || !targetDb) {
      return NextResponse.json(
        {
          error: "sourceBancoId, targetBancoId, sourceDb e targetDb são obrigatórios",
        },
        { status: 400 }
      )
    }

    const sourceResolvida = await resolverConnectionString(Number(sourceBancoId))
    const targetResolvida = await resolverConnectionString(Number(targetBancoId))
    if (!sourceResolvida || !targetResolvida) {
      return NextResponse.json(
        { error: "Conexão não encontrada para um dos bancoIds informados" },
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
