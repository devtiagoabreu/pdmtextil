import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createDatabase } from "@/lib/db-admin"
import { resolverConnectionString } from "@/lib/db-admin/resolve-conn"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { bancoId, connectionString, dbName } = await req.json()
    const resolvida = bancoId
      ? await resolverConnectionString(Number(bancoId))
      : (connectionString ?? null)
    if (!resolvida || !dbName) {
      return NextResponse.json(
        { error: "bancoId (ou connectionString) e dbName são obrigatórios" },
        { status: 400 }
      )
    }

    const result = await createDatabase(resolvida, dbName)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/config/banco-dados/criar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
